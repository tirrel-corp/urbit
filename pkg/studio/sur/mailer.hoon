|%
+$  from-field     [email=cord name=cord]
+$  content-field  [type=cord value=cord]
+$  personalization-field
  $:  to=(list cord)
      headers=(map cord cord)
      substitutions=(list [cord cord])
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
      [%add-list name=term mailing-list=(set @t)]
      [%del-list name=term]
      [%add-recipients name=term mailing-list=(set @t)]
      [%del-recipients name=term mailing-list=(set @t)]
  ==
::
+$  update
  $%  [%initial creds=(unit [@t @t @t]) ml=(map term mailing-list)]
  ==
::
+$  mailing-list  (map @t @uv)
--
