# Auth CLI Scripts

This is a sub-project of Auth Service that runs from the command line.

It has four scripts that I can run using bun: signup.ts, signin.ts, verify.ts, signout.ts

Written in typescript.

The subproject is in the cli folder and has it's own package.json file.   

Uses bun instead of npm.

Each script reads a small json data file that defines a list of known users

Does not need unit tests.

Accepts a single parameter on as input to each of the scripts

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
* signout.ts dpw

If the json is missing, it outputs an error message.

uses console statements to write to the terminal.

**Important**: Do not generate any code during this planning phase.

