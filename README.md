## Run web and test

Run react web server:

```
cd react && npm run dev
```

![alt text](image.png)

Unit testing

```
npm run test:component
```

E2E testing

```
npm run test
```

## Webdriverio setup

```
npm init -y
npm i @wdio/cli
npx wdio config
npm run wdio
```