Example workflow that runs whenever commits are pushed on branch `master`.

`.github/workflows/example.yml`
```yaml
name: Try installing Node dependencies
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