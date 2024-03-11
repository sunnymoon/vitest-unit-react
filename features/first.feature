#language: pt
Funcionalidade: Calculator

  Cenário: Adding two numbers together
    Dado I have entered 50 into the calculator
    E I have entered 70 secondly into the calculator
    Quando I press add
    Então the result should be 110 on the screen

  Cenário: Adding two numbers together with an error
    Dado I have entered 40 into the calculator
    E I have entered 70 secondly into the calculator
    Quando I press add
    Então the result should be 112 on the screen