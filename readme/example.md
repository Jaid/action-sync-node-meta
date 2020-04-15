### overwrite-file

Example workflow that runs whenever commits are pushed on branch `master`.  
This will overwrite the `package.json` file if it differs from the GitHub repository info.

`.github/workflows/example.yml`
```yaml
name: Sync package.json with repository data
on:
  push:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: actions/checkout
        uses: actions/checkout@v2.0.0
      - name: actions/setup-node
        uses: actions/setup-node@v1.4.1
        with:
          node-version: "13.9.0"
      - name: Jaid/action-sync-node-meta
        uses: jaid/action-sync-node-meta@v1.0.0
        token: ${{ secrets.GITHUB_TOKEN }}
```

### overwrite-github

Example workflow that runs whenever commits are pushed on branch `master`.  
This will change the GitHub repository info whenever it differs from the content of `package.json`.

The secret `customGithubToken` is forwarded to the input `token`. It has to be a [personal access token](https://github.com/settings/tokens) with scope "repo" added in [your repository's secrets settings](https://github.com/YOUR_NAME/YOUR_REPOSITORY/settings/secrets).

`.github/workflows/example2.yml`
```yaml
name: Sync package.json with repository data
on:
  push:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: actions/checkout
        uses: actions/checkout@v2.0.0
      - name: actions/setup-node
        uses: actions/setup-node@v1.4.1
        with:
          node-version: "13.9.0"
      - name: Jaid/action-sync-node-meta
        uses: jaid/action-sync-node-meta@v1.0.0
        direction: overwrite-github
        token: ${{ secrets.customGithubToken }}
```