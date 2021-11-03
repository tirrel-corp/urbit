/-  *post
|%
+$  flow
  $:  =resource
      title=@t
      =index
      site=(unit [template=term =binding:eyre])
      email=(unit term)
  ==
+$  action
  $%  [%add name=term flow]
      [%remove name=term]
  ==
::
+$  site-inputs
  $:  name=term
      title=@t
      =binding:eyre
      posts=(list [@da post])
  ==
+$  site-template   $-(site-inputs website)
+$  email-template  $-(site-inputs website)  :: XX
+$  website  (map path mime)
+$  update   [%built name=term =website]
--
