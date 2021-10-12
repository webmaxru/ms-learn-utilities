# MS Learn Utilities

Set of tools to provide better experience for the learners and educators on MS Learn.

- MS Learn Navigator: Visual way to navigate MS Learn for providing better experience for the learners and educators. Based on [Microsoft Learn Catalog API](https://docs.microsoft.com/en-us/learn/support/catalog-api)

<p align="center">
    <img src="public/images/social.png" width="300">
</p>

### Try this in action

This is a Progressive Web Application (installable, offline-ready) driven by Workbox-powered service worker.

[https://aka.ms/mslearn-util](https://aka.ms/mslearn-util)

## Flow and resources for the Azure Static Web Apps features demo

### Installation

```shell
git clone https://github.com/webmaxru/ms-learn-utilities.git
cd ms-learn-utilities
npm install

# Installing tools for Static Web Apps and Azure Functions
npm install -g @azure/static-web-apps-cli
npm install -g azure-functions-core-tools@3 --unsafe-perm true
```

### Starting local development server

```shell
# Instead of CRA's "npm start" we use SWA CLI's command to start everything at once
swa start http://localhost:3000 --run "npm start" --api ./api
```

Open [http://localhost:4280](http://localhost:4280) in your browser.

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Author

[Maxim Salnikov](https://twitter.com/webmaxru). Feel free to contact me if you have any questions about the project, PWA, Azure Static Web Apps.
