#language: pt
Funcionalidade: Ábaco 

  Cenário: Adding two numbers together abacus
    Dado I have entered 40 into the abacus
    E I have entered 70 secondly into the abacus
    Quando I press add
    Então the result should be 110 on the abacus


  Cenário: Adding two numbers together with an error on an abacus
    Dado I have entered 40 into the abacus
    E I have entered 70 secondly into the abacus
    Quando I press add
    Então the result should be 110 on the screen