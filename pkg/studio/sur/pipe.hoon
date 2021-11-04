/-  *post, meta=metadata-store
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
+$  site-inputs
  $:  name=term
      =binding:eyre
      posts=(list [@da post])
      =association:meta
  ==
+$  site-template   $-(site-inputs website)
+$  email-template  $-(site-inputs website)  :: XX
+$  website  (map path mime)
+$  update   [%built name=term =website]
--
