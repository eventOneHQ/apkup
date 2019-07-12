# Security Policy

## Reporting a Vulnerability

If you have found a security vulnerability, do _**NOT**_ create a regular issue! Instead, encrypt the issue with `gpg` or `openssl`.

### GPG
To report an issue with GPG, follow these steps:

1. Write the issue in a markdown file (e.g. `issue.md`)
2. Import the public key: `gpg --keyserver keyserver.ubuntu.com --recv 51AB060B`
3. Encrypt the `issue.md` file: `gpg --recipient 51AB060B --armor --encrypt issue.md`
4. Copy the contents of the `issue.md.asc` file and create a [new issue](https://github.com/eventOneHQ/apkup/issues/new) with that.

### OpenSSL
To report an issue with OpenSSL, follow these steps:

1. Write the issue in a markdown file (e.g. `issue.md`)
2. Install `cipherhub`: `[sudo] npm install -g cipherhub`
3. Encrypt the `issue.md` file: `cipherhub nprail < issue.md`
4. Copy output and create a [new issue](https://github.com/eventOneHQ/apkup/issues/new) with that.