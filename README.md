# Backend

##prerequisite

Add default user to database

```bash
$ mongo
$ use securityDB
$ db.snsdata.insert({
	"__type" : "roleDetails",
	"emailId" : "snsuser@yopmail.com",
	"role" : "SuperAdmin",
	"lastName" : "snsuser",
	"firstName" : "SNSUSER",
}
);
```

## Installation

```bash
$ npm install 
```

## Quick Start

Start the server:

```bash
$ nodemon server.js
```