<p align="center">
      <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Overview

Spect is a playground of coordination tools for DAO contributors to manage projects and fund each other.

## Techs Used

Spect makes use of the following technologies on the backend:

- NestJS
- TypeScript
- MongoDB
- Mongoose
- Ethers js
- Alchemy

## Setting up locally

We’d need the following software to run the project locally, some of which you may already have;

Node

MongoDB

### Installation of software

To install MongoDB, visit [https://www.mongodb.com/docs/manual/administration/install-community/](https://www.mongodb.com/docs/manual/administration/install-community/) and get setup.

To install Node, visit [https://nodejs.org](https://nodejs.org/en/), download and install the setup file.

Upon installation, confirm that you have it installed by entering the following command in your terminal:

```bash
node -v
```

You should get some numbers to indicate what version you have installed.

If you do not receive those numbers, try running the installation again.

### Cloning of the repository

Spin up your terminal, navigate to the folder where you’d like the project repo to be stored, and run the following commands

```bash
git clone https://github.com/spect-ai/api.v1
```

This should clone the project repository to your local machine, where you can run and test locally.

### Installation

Upon successful cloning of the repository, spin up your terminal and navigate to the project folder.

If you do not have yarn installed, visit [https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install) and follow the instructions to install.

 Run the following command in the project repository

```bash
yarn install
```

This should install all the required dependencies to successfully run the project locally.

### Setting up your environmental variables

In order to run the project successfully, you’d need the environmental variables, setup in the .env file.

In your .env file, we’d define three variables;

HOST

PORT : Your API would be served to this

MONGODB_URI

```markdown
HOST=0.0.0.0
PORT=8080
MONGODB_URI
```

### Setting up dB

With Mongo installed and started, you can connect to the Mongo instance from the URI you’ve set up in your .env file.

This should sync when you run the project repo.

### Running the repo

With the dependencies installed, and your environment variables all defined, run the following command.

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

This should serve the project on localhost, to the port you have defined in your .env; in our case, 8080.

### Testing

To run the defined tests, you can run the required command from the following set:

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Git Commit Rules

### Revert

If the commit reverts a previous commit, it should begin with revert:, followed by the header of the reverted commit. In the body it should say: This reverts commit <hash>., where the hash is the SHA of the commit being reverted.

### Type

Must be one of the following:
feat: A new feature

fix: A bug fix

docs: Documentation only changes

style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)

refactor: A code change that neither fixes a bug nor adds a feature

perf: A code change that improves performance

test: Adding missing tests

chore: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Example

For a commit which should state that updates where made to the circles endpoint, the commit message would be modelled like this:

```bash
chore: updates to the circles endpoint
```

## License

Nest is [MIT licensed](LICENSE).
