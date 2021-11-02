/-  *post
|%
+$  flow
  $:  =resource
      =index
      site=(unit [template=term =binding:eyre])
      email=(unit term)
  ==
+$  action
  $%  [%add name=term flow]
      [%remove name=term]
  ==
::
+$  website  (map path mime)
+$  update   [%built name=term =website]
--
