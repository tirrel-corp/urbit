|%
+$  from-field     [email=cord name=cord]
+$  content-field  [type=cord value=cord]
+$  personalization-field
  $:  to=(list cord)
      headers=(map cord cord)
  ==
+$  email
  $:  from=from-field
      subject=cord
      content=(list content-field)
      personalizations=(list personalization-field)
  ==
::
+$  action
  $%  [%send-email =email]
      [%set-creds api-key=@t email=@t ship-url=@t]
      [%add-blog name=term mailing-list=(set @t)]
      [%del-blog name=term]
      [%add-recipients name=term mailing-list=(set @t)]
      [%del-recipients name=term mailing-list=(set @t)]
  ==
+$  mailing-list  (map @t @uv)
--
