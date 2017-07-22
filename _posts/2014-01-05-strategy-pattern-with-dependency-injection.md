---
layout: post
title: "Strategy Pattern with Dependency Injection"
date: 2014-01-05 23:08:22 +0200
categories: [Design Patterns, Dependency Injection, C#]
---

[Strategy pattern][1] is one of the most useful design patterns in OOP. It lets you select an algoritm's implementation at runtime. However most of the examples you will find online won't make sense if you are using dependency injection. Here's one of them:

```csharp
public interface IPaymentMethod
{
    PaymentResult Process(PaymentRequest request);
}

public class CashOnDelivery : IPaymentMethod
{
    public PaymentResult Process(PaymentRequest request)
    {
        Console.WriteLine("Pay with cash on delivery");
        return null;
    }
}

public class CreditCardPayment : IPaymentMethod
{
    public PaymentResult Process(PaymentRequest request)
    {
        Console.WriteLine("Pay with credit card");
        return null;
    }
}

public interface IPaymentService
{
    PaymentResult Pay(string paymentMethodName, PaymentRequest request);
}

public class PaymentService : IPaymentService
{
    public PaymentResult Pay(string paymentMethodName, PaymentRequest request)
    {
        IPaymentMethod paymentMethod = null;

        if (paymentMethodName == "Cash")
        {
            paymentMethod = new CashOnDelivery();
        }
        else if (paymentMethodName == "CreditCard")
        {
            paymentMethod = new CreditCardPayment();
        }
        else
        {
            //default implementation
        }

        return paymentMethod.Process(request);
    }
}
```

This example has a few problems:

- PaymentService class is tightly coupled to the implementations of IPaymentMethod.
- We are using new keyword to create instances instead of letting them be resolved by the DI container. It will get worse if we don't have default constructors for these types. [Service Locator][2] is out of the question!
- [Open/closed principle][3] will be clearly violated once we have to create new payment methods.

We have to find a way to resolve the implementations by DI container. We can start by adding an identifier to the strategy interface to move the selection outside of the client code.

```csharp
public interface IPaymentMethod
{
    string Name { get; }
    PaymentResult Process(PaymentRequest request);
}

public class CashOnDelivery : IPaymentMethod
{
    public CashOnDelivery()
    {
        Name = "Cash";
    }
    
    public string Name { get; private set; }

    public PaymentResult Process(PaymentRequest request)
    {
        Console.WriteLine("Pay with cash on delivery");
        return null;
    }
}

public class CreditCardPayment : IPaymentMethod
{
    public CreditCardPayment()
    {
        Name = "CreditCard";
    }

    public string Name { get; private set; }

    public PaymentResult Process(PaymentRequest request)
    {
        Console.WriteLine("Pay with credit card");
        return null;
    }
}
```

We added a simple name property to the strategy interface. It will make our selection code much simpler. You can use a method here if your selection logic is more complex.

Selecting a strategy is really easy now but we can make use of an another abstraction to keep the client code simpler. 

```csharp
public interface IPaymentMethodResolver
{
    IPaymentMethod Resolve(string name);
}

public class PaymentMethodResolver : IPaymentMethodResolver
{
    private readonly IEnumerable<IPaymentMethod> _paymentMethods;

    public PaymentMethodResolver(IEnumerable<IPaymentMethod> paymentMethods)
    {
        _paymentMethods = paymentMethods;
    }

    public IPaymentMethod Resolve(string name)
    {
        IPaymentMethod paymentMethod = _paymentMethods.FirstOrDefault(item => item.Name == name);
        if (paymentMethod == null)
        {
            throw new ArgumentException("Payment method not found", name);
        }
        return paymentMethod;
    }
}
```

Resolve method is pretty simple and we get the payment method implementations by constructor injection. The only thing left to do is registration. Any decent DI container will let you inject multiple implementations of an interface as a collection. Here's how you can do it with [Castle Windsor][4].

```csharp
container.Register(
    Component.For<IPaymentService>().ImplementedBy<PaymentService>(),
    Component.For<IPaymentMethodResolver>().ImplementedBy<PaymentMethodResolver>(),
    Classes.FromThisAssembly().IncludeNonPublicTypes().BasedOn<IPaymentMethod>()
           .WithService.FromInterface()
    );

CollectionResolver collectionResolver = new CollectionResolver(container.Kernel);
container.Kernel.Resolver.AddSubResolver(collectionResolver);
```

It's done. Now the PaymentService looks like this:

```csharp
public class PaymentService : IPaymentService
{
    private readonly IPaymentMethodResolver _paymentMethodResolver;

    public PaymentService(IPaymentMethodResolver paymentMethodResolver)
    {
        _paymentMethodResolver = paymentMethodResolver;
    }

    public PaymentResult Pay(string paymentMethodName, PaymentRequest request)
    {
       IPaymentMethod paymentMethod = _paymentMethodResolver.Resolve(paymentMethodName);
       return paymentMethod.Process(request);
    }
}
```


[1]: http://sourcemaking.com/design_patterns/strategy
[2]: http://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/
[3]: http://en.wikipedia.org/wiki/Open/closed_principle
[4]: http://docs.castleproject.org/Windsor.MainPage.ashx
