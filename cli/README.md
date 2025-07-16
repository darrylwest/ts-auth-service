# Auth CLI Scripts

This is a sub-project of Auth Service that runs from the command line as a client of Auth Service.

It has four scripts that I can run using bun: signup.ts, signin.ts, verify.ts, signout.ts

Written in typescript.

Uses axios as the client.

The subproject is in the cli folder and has it's own package.json file.   

The project uses bun instead of npm.

Uses zod for validation of the user model.

Each script reads a small json data file that defines a list of known users

Does not need unit tests.

Accepts a single parameter on as input to each of the scripts

Data File:

```json
[
    "dpw": {
        "email":"dpw500@raincitysoftware.com",
        "password":"pass1234",
        "name":"dpw coder"
    },
    "john": {
        "email":"john@raincitysoftware.com",
        "password":"pass1234",
        "name":"john sales"
    }
]
```

Command Line use:

* signup.ts dpw
* signin.ts dpw
* verify.ts dpw
* verify-email.ts dpw true
* signout.ts dpw

If the name is missing or not found, it outputs an error message.

uses console statements to write to the terminal.

Ask me questions if you don't fully understand my instructions.

**Important**: Do not generate any code during this planning phase.

