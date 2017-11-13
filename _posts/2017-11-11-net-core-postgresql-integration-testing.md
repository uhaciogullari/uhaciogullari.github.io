---
layout: post
title: ".NET Core PostgreSQL Integration Testing"
date: 2017-11-11 23:08:22 +0100
categories: [.NET Core, C#, PostgreSQL, Integration Testing]
---

If you are thinking about switching to PostgreSQL, having solid integration tests will make you more confident. With support from popular ORMs like Entity Framework Core and Dapper, PostgreSQL is a great alternative for .NET Core applications. In this blog post, I will explain how you can use basic Postgres CLI tools, create and clean up databases for your tests.

## Setup 

If you have Postgres installed and you are comfortable with Postgres CLI, just skip to the [next section](#creating-test-user).

[Installing Postgres][1] is pretty straightforward. Just make sure that you note down your password.

There are many CLI tools for communicating with Postgres. They are in bin folder of Postgres installation, so adding this folder to your path will make things easier. For my installation, it was like below:

    c:\Program Files\PostgreSQL\10\bin

We also need to provide credentials to these applications every time we invoke them. Postgres provides a way to store these credentials in a [passfile][2] but somehow it didn't work for me. Fortunately, it's possible to store the credentials in environment variables as well. You can easily save them from the command line:

    SETX PGUSER postgres
    SETX PGPASSWORD your-own-password

You will need to restart your command line for the changes to take effect. After that, you should be able to connect to Postgres with psql tool.

![Running psql for the first time][3]

Here you see that you are connected to `postgres` database (it's not the username) and `=#` means that you are logged in as a superuser. A superuser can override all access restrictions within the database. Being a good developer, we will create a new user with less privileges for our tests.

## <a id="creating-test-user">Creating test user</a>

Postgress comes with another CLI called createuser. You can invoke it directly from the command line:

    createuser -d -P integration_test_user

If you are still running psql, you can execute Windows commands by prefixing it with `\!`:

    \! createuser -d -P integration_test_user

You will get a password prompt for this user, make sure it's saved as well. We are done with Postgres for now.

## Test project




[1]: https://www.postgresql.org/download/windows/
[2]: https://www.postgresql.org/docs/current/static/libpq-pgpass.html
[3]: /assets/img/psql.png