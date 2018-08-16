const aws = require('aws-sdk');
const fs = require('fs');
const defaults = require('lodash').defaults;

const credentialsExpired = c => {
    if (c && c.Credentials) {
        const expiration = new Date(c.Credentials.expiration);
        if (expiration.getTime() < new Date().getTime()) {
            return true;
        }
    }
    return false;
};

const getTemporaryCredentials = (config, callback) => {
    defaults(config, {
        credentials: {
            fileName: process.env.AWS_STS_FILE_NAME || './.aws-sts.json',
            mode: parseInt(process.env.AWS_STS_FILE_MODE, 8) || 0o600,
        },
        role: {
            arn: process.env.AWS_ROLE_ARN || '',
            sessionName: process.env.AWS_ROLE_SESSION_NAME || 'temporary'
            durationSeconds: process.env.AWS_ROLE_DURATION_SECONDS || 43200
        },
        key: {
            access: process.env.AWS_STS_ACCESS_KEY || '',
            secret: process.env.AWS_STS_ACCESS_SECRET || ''
       }
    });

    const sts = new aws.STS({
        accessKeyId: config.key.access,
        secretAccessKey: config.key.secret
    });

    fs.readFile(config.credentials.fileName, 'utf-8', (err, old) => {
        if (err || credentialsExpired(old)) {
            sts.assumeRole({
                RoleArn: config.role.arn,
                RoleSessionName: config.role.sessionName,
                DurationSeconds: config.role.durationSeconds
            }, (err, newCredentials) => {
                if (err) return callback(err, null);
                fs.writeFile(
                    config.credentials.fileName,
                    JSON.stringify(newCredentials),
                    {
                        mode: config.credentials.mode,
                        encoding: 'utf-8'
                    },
                    err => {
                        if (err) return callback(err, null);
                        return callback(null, newCredentials);
                    }
                );
            });
        } else {
            return callback(null, old);
        }
    });
};


module.exports = {
    getTemporaryCredentials: getTemporaryCredentials
};
