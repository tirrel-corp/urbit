|%
+$  from-field     [email=cord name=cord]
+$  content-field  [type=cord value=cord]
+$  personalization-field  [to=cord ~]  ::  todo: extend
+$  email
  $:  from=from-field
      subject=cord
      content=(list content-field)
      personalizations=(list personalization-field)
  ==
::
+$  action
  $%  [%send-email =email]
      [%asdf ~]
  ==
--
