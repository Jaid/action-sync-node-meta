### overwrite-file

Example workflow that runs whenever commits are pushed on branch `master`.  
This will overwrite the `package.json` file if it differs from the GitHub repository info.

This is the recommended syncing direction, because of the more simple setup (no need to manually add a secret to the repository settings) and the advantages of git commits (better monitoring, revertability).

`.github/workflows/example.yml`
```yaml
name: Sync package.json with repository info
on:
  push:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: actions/checkout
        uses: actions/checkout@v2.3.4
      - name: actions/setup-node
        uses: actions/setup-node@v2.1.5
        with:
          node-version: "16.2.0"
      - name: Jaid/action-sync-node-meta
        uses: jaid/action-sync-node-meta@v1.4.0
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }}
```

### overwrite-github

Example workflow that runs whenever commits are pushed on branch `master`.  
This will change the GitHub repository info whenever it differs from the content of `package.json`.

The secret `customGithubToken` is forwarded to the input `githubToken`. It has to be a [personal access token](https://github.com/settings/tokens) with scope "repo" added in [your repository's secrets settings](https://github.com/YOUR_NAME/YOUR_REPOSITORY/settings/secrets).

`.github/workflows/example2.yml`
```yaml
name: Sync repository info with package.json
on:
  push:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: actions/checkout
        uses: actions/checkout@v2.3.4
      - name: actions/setup-node
        uses: actions/setup-node@v2.1.5
        with:
          node-version: "16.2.0"
      - name: Jaid/action-sync-node-meta
        uses: jaid/action-sync-node-meta@v1.4.0
        with:
          direction: overwrite-github
          githubToken: ${{ secrets.customGithubToken }}
```

<details>
<summary>Detailed setup</summary>
Go to your account settings and then to “Developer settings”.

![Token setup: Step 1](readme/tokenSteps/01.png)

Go to “Personal access tokens”.

![Token setup: Step 2](readme/tokenSteps/02.png)

Click “Generate new token”.

![Token setup: Step 3](readme/tokenSteps/03.png)

Give it a good title, so you still know what your token does in one year. Add „repo“ permissions.

![Token setup: Step 4](readme/tokenSteps/04.png)

Copy the generated token.

![Token setup: Step 5](readme/tokenSteps/05.png)

Go to the repository that uses action-sync-node-meta. Go to “Settings”, “Secrets”.

![Token setup: Step 6](readme/tokenSteps/06.png)

Click “New repository secret”.

![Token setup: Step 7](readme/tokenSteps/07.png)

Add the secret token from your clipboard. Name the token “repoGithubToken” or anything you like.

![Token setup: Step 8](readme/tokenSteps/08.png)

Now pass the token to action-sync-node-meta in your workflow file.

```yaml
- name: Jaid/action-sync-node-meta
  uses: jaid/action-sync-node-meta@v1.4.0
  with:
    direction: overwrite-github
    githubToken: ${{ secrets.“repoGithubToken” }}
```

</details>
