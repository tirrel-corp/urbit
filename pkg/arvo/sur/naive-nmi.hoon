|%
+$  init-info
  $:  amount=cord
::      $=  billing
::      $:  first-name=cord
::          last-name=cord
::          address1=cord
::          address2=cord
::          city=cord
::          state=cord
::          postal=cord
::          phone=cord
::          email=cord
::      ==
  ==
::
+$  action
  $%  [%initiate-payment info=init-info request-id=cord]
      [%complete-payment token-id=cord]
      [%set-api-key key=cord]
      [%set-redirect-url url=cord]
  ==
--

