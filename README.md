# aws-sts-helper

A library for facilitating the acquisition of temporary security tokens through the AWS Security Token Service (STS)

## What does it do?

Using a particular AWS access key pair, query for and store a new access key pair, plus session token that is suitable to use for another role, that may have more specific or narrower permissions than the original access key pair.

For example, a role could be constructed with a policy that only allows for the creation of a named S3 bucket `dev-projects-*`, and provide all read-write permissions to the bucket created. Then this role can be access using the generated temporary access key and token by a locally developed project, limited to accessing just the `dev-projects-*` buckets in S3.

By default, any credentials created in this way are stored in a file, `./.aws-sts.json`. This way the credentials are cached locally and available to reuse for the duration that the temporary credentials last. This library will look for the existence of the stored credentials and if they are still valid (not-expired) it will return them instead of generating a new set.

### Usage:

You can set environment variables and/or set values in the configuration map passed into the `getTemporaryCredentials` call.

Available variables and their usage:

| Env Variable    | Default     | Purpose/Default |
|-----------------------|-------------------------------------|-----------------------------------------------------------------|
| AWS_STS_ACCESS_KEY    | | Equivalent to `AWS_ACCESS_KEY_ID`. Used to generate credentials suitable to assume a specific role and the policies associated with it. |
| AWS_STS_ACCESS_SECRET | | Equivalent to `AWS_SECRET_ACCESS_KEY`. Used to generate credentials suitable to assume a specific role and the policies associated with it. |
| AWS_ROLE_ARN          | | The Role to assume in ARN format|
| AWS_ROLE_SESSION_NAME | `temporary` |  A name that will be assigned to the temporary credentials |
| AWS_STS_FILE_NAME | `./.aws-sts.json` | Used to store credentials in JSON format, fully qualified path to credential file|
| AWS_ROLE_DURATION_SECONDS | 43200 | Number of seconds the temporary access key lasts|
| AWS_STS_FILE_MODE | 0o600 | Permissions setting on JSON file that caches credentials, (600 is user read-write only) |

These values can be passed either in the environment or in a configuration object, with environment variables overriding any passed in configuration.

```javascript
const sts = require('aws-sts-helper');

sts.getTemporaryCredentials({
    {
        credentials: {
            fileName: './.aws-sts.json',
            mode: 0o600
        },
        role: {
            arn: 'arn:aws:iam::<account number>:role/ProjectsS3Development',
            sessionName: 'colbyProjectsDev',
            durationSeconds: 43200
        },
        key: {
            access: 'access key that allows calls to STS assume role',
            secret: 'secret key paired to access key'
        }
    }
}, (err, temp) => {
    if (err) {
        console.log('err:',err);
        process.exit(-1);
    }

    console.log('temp:',temp);
    var sh = `export AWS_ACCESS_KEY_ID=${temp.Credentials.AccessKeyId}\n` +
       `export AWS_SECRET_ACCESS_KEY=${temp.Credentials.SecretAccessKey}\n` +
       `export AWS_SESSION_TOKEN=${temp.Credentials.SessionToken}\n`;
    fs.writeFileSync("aws-temp-credentials.sh", sh, {encoding:'utf-8'});
});
```
