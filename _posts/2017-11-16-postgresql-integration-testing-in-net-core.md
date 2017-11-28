---
layout: post
title: "PostgreSQL Integration Testing in .NET Core"
date: 2017-11-16 00:01:00 +0100
categories: [.NET Core, C#, PostgreSQL, Integration Testing]
image: postgres-net-core.png
---

PostgreSQL is becoming an attractive alternative for .NET Core applications with support from popular ORMs like Entity Framework Core and Dapper. If you are thinking about switching to Postgres, having solid tests will make you more confident with the transition.

In this blog post, I will explain how you can use basic Postgres CLI tools, create and clean up databases for your tests.

## Setup 

If you have Postgres installed and you are comfortable with Postgres CLI, just skip to the [next section](#creating-test-user).

[Installing Postgres][1] is pretty straightforward. Just make sure that you note down your password.

There are many CLI tools for communicating with Postgres. They are in bin folder of Postgres installation, so adding this folder to your path will make things a lot easier. For my installation, it was like below:

    c:\Program Files\PostgreSQL\10\bin

We also need to provide credentials to these applications every time we invoke them. Postgres provides a way to store these credentials in a [passfile][2] but somehow it didn't work for me. Fortunately, it's possible to store the credentials in environment variables as well. You can easily create them from the command line:

    SETX PGUSER postgres
    SETX PGPASSWORD your-own-password

You will need to restart your console for the changes to take effect. After that, you should be able to connect to Postgres with psql tool.

![Running psql for the first time][3]

Here you see that you are connected to *postgres* database (it's not the username) and *=#* means that you are logged in as a superuser. A superuser can override all access restrictions within the database. Being a good developer, we will create a new user with less privileges for our tests.

## <a id="creating-test-user">Creating test user</a>

Postgress comes with another CLI called [createuser][4]. You can invoke it directly from the command line:

    createuser -d -P integration_test_user

If you are still running psql, you can execute console commands by prefixing it with *\\!*

    \! createuser -d -P integration_test_user

You will get a password prompt for the user, make sure it's saved as well and we are done with Postgres for now.

## Test project

To run our tests, we will create a new database with its schema and destroy it after the tests are run. [xUnit.net][5] offers [Collection Fixtures][6] feature that enables us to do that. We will create a collection fixture that creates a Postgres database and drop it when it's disposed. 

Creating and dropping databases can be implemented easily but it's not something you want to write every time. Also there are some trivial stuff that you have to get right. For example: there is a background connection to the database that prevents you from dropping it, you have to kill it before you can drop the database. To hide details like this, I created [DoomedDatabases.Postgres][7] library. Create a new .NET Core xUnit project and reference this package. 

    Install-Package DoomedDatabases.Postgres

We'll start really simple to make sure we can create and drop a database. Don't worry about the connection string in the code for now, we'll move it to a setting file.

```csharp
using System;
using DoomedDatabases.Postgres;
using Xunit;

public class DatabaseFixture : IDisposable
{
    private readonly ITestDatabase testDatabase;

    public DatabaseFixture()
    {
        var connectionString = "User ID=integration_test_user;Password=yourpassword;Server=localhost;Database=postgres;";
        testDatabase = new TestDatabaseBuilder().WithConnectionString(connectionString).Build();
        testDatabase.Create();
    }

    public void Dispose()
    {
        testDatabase.Drop();
    }
}

[CollectionDefinition("Database")]
public class DatabaseCollectionFixture : ICollectionFixture<DatabaseFixture>
{
}
```

We will attach this fixture to a test class with a CollectionAttribute. xUnit will make sure the fixture is created before any test is run and dispose it afterwards.

```csharp
using Xunit;

[Collection("Database")]
public class CreateDatabaseTests
{
    [Fact]
    public void CreateAndDropDatabase()
    {
        Assert.True(true);
    }
}
```

This test just makes sure that we can run the fixture code without any exceptions. If everything is ok, the test should pass. You should be able to see the database getting created and dropped while debugging.

![Debugging the test][8]

## Moving the connection string to a setting file

Test projects are not created with setting files so we have to create one manually. Create an appsettings.json file in the test project folder that includes your connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "User ID=integration_test_user;Password=yourpassword;Server=localhost;Database=postgres;"
  }
}
```

We also have to make sure that the file is copied to output directory. Add this line inside an *\<ItemGroup\>* tag in your test project csproj file.

    <Content Include="appsettings.json" CopyToOutputDirectory="PreserveNewest" />

We need [Microsoft.Extensions.Configuration.Json package][9] to read settings from the file.

    Install-Package Microsoft.Extensions.Configuration.Json

Now we can wire it up:

```csharp
var configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
testDatabase = new TestDatabaseBuilder().WithConfiguration(configuration).Build();
```

If you want to use a different connection string name, you can use *WithConnectionStringName* method.

## Creating the schema with scripts

Creating a database won't be very useful without the schema and proper data in place. If you are following the [evolutionary database design][10], it's very easy to create it from scratch. You can easily run the scripts in a folder on the test database.

```csharp
public DatabaseFixture()
{
    var configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
    testDatabase = new TestDatabaseBuilder().WithConfiguration(configuration).Build();
    testDatabase.Create();
    testDatabase.RunScripts("./DatabaseScripts");
}
```

RunScripts method will run all the files in lexicographical order.

If you have script files in another project already, you can link them in your test project like this:

```xml
<Content Include="..\OtherProject\DatabaseScripts\*.sql"
         Link="DatabaseScripts\%(Filename)%(Extension)"
         CopyToOutputDirectory="PreserveNewest" />
```

## Creating the schema with Entity Framewok Core

Entity Framework Core can also be used to create the schema. We will be using [Postgres provider for Entity Framework Core][11]. Andrew Lock has [a great post][12] for using the Postgres naming convention (snake_case) in EF Core, I moved it to [a gist][13] for the sake of brevity, you can plug it in easily if you wish. We'll create a really simple DbContext.

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
}

public class TestDbContext : DbContext
{
    public TestDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        //modelBuilder.UsePostgresConventions();
    }

    public DbSet<User> Users { get; set; }
}
```

Now we can instantiate TestDbContext in DatabaseFixture and let EF create the schema:

```csharp
public DatabaseFixture()
{
    var configuration = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build();
    TestDatabase = new TestDatabaseBuilder().WithConfiguration(configuration).Build();
    TestDatabase.Create();

    var builder = new DbContextOptionsBuilder<TestDbContext>();
    builder.UseNpgsql(TestDatabase.ConnectionString);
    DbContext = new TestDbContext(builder.Options);
    DbContext.Database.EnsureCreated();
}

public TestDbContext DbContext { get; }
```

Finally we can implement tests using EF:

```csharp
[Collection("Database")]
public class UserTests
{
    private TestDbContext testDbContext;

    public UserTests(DatabaseFixture databaseFixture)
    {
        testDbContext = databaseFixture.DbContext;
    }

    [Fact]
    public async Task InsertUsers()
    {
        await testDbContext.Users.AddAsync(new User { Username = "Pramod" });
        await testDbContext.Users.AddAsync(new User { Username = "Martin" });
        await testDbContext.SaveChangesAsync();
        var count = await testDbContext.Users.CountAsync();
        Assert.Equal(2, count);
    }
}
```

## Overwriting the connection string for the ASP.NET Core MVC application

We want to use the test database while we are creating a test server for our ASP.NET Core MVC application. Assuming you have the schema in place already, you need to use the connection string for the database we create:

```csharp
var webHostBuilder = new WebHostBuilder().UseStartup<Startup>()
                                         .UseSetting("ConnectionStrings:DefaultConnection", testDatabase.ConnectionString);

var server = new TestServer(webHostBuilder);
```

## Adding extensions to the test database

One thing you will be missing in a default Postgres database is GUID ids. It can be easily enabled by adding an [extension][14] but only superusers have this privilege. Since we are deliberately not using a superuser, we cannot do it with the test scripts. We can accomplish this with [template databases][15]. This also requires a superuser but we have to do it only once.

We create a new database with the superuser from the console:

    createdb uuid_extension_enabled

Connect to this database with psql:

    psql -d uuid_extension_enabled

Enable the extension:

    create extension "uuid-ossp";

Mark the database as a template

    update pg_database set datistemplate=true  where datname='uuid_extension_enabled';

Finally close the psql process (there should be no active connections to a database template when we want to use it) and we can use the template now:

```csharp
testDatabase = new TestDatabaseBuilder().WithConfiguration(configuration).WithTemplateDatabase("uuid_extension_enabled").Build();
```

[1]: https://www.postgresql.org/download/windows/
[2]: https://www.postgresql.org/docs/current/static/libpq-pgpass.html
[3]: /assets/img/psql.png
[4]: https://www.postgresql.org/docs/10/static/app-createuser.html
[5]: https://xunit.github.io
[6]: https://xunit.github.io/docs/shared-context.html#collection-fixture
[7]: https://github.com/uhaciogullari/doomed-databases
[8]: /assets/img/create_drop_db.gif
[9]: https://www.nuget.org/packages/Microsoft.Extensions.Configuration.Json
[10]: https://martinfowler.com/articles/evodb.html
[11]: https://www.nuget.org/packages/Npgsql.EntityFrameworkCore.PostgreSQL/
[12]: https://andrewlock.net/customising-asp-net-core-identity-ef-core-naming-conventions-for-postgresql/
[13]: https://gist.github.com/uhaciogullari/94bd1e56bbd6feaadfe83b4a61e3e1fd
[14]: https://www.postgresql.org/docs/current/static/external-extensions.html
[15]: https://www.postgresql.org/docs/current/static/manage-ag-templatedbs.html