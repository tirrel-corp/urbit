|%
+$  init-info
  $:  amount=cord
      $=  billing
      $:  first-name=cord
          last-name=cord
          address1=cord
          address2=cord
          city=cord
          state=cord
          postal=cord
          phone=cord
          email=cord
      ==
  ==
::
+$  update
  $%  [%initiate-payment init-info]
      [%asdf ~]
  ==
--

