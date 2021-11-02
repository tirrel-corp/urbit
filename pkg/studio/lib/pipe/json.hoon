/-  *pipe
/+  resource, graph-store
|%
++  dejs
  =,  dejs:format
  |%
  ++  action
    %-  of
    :~  [%add (ot name+so flow+flow ~)]
        [%remove (ot name+so ~)]
    ==
  ++  flow
    %-  ot
    :~  resource+dejs:resource
        index+(su ;~(pfix fas (more fas dem)))
        serve+(mu so)
        email+(mu so)
    ==
  --
++  enjs
  =,  enjs:format
  |%
  ++  flow
    |=  f=^flow
    %-  pairs
    :~  resource+(enjs:resource resource.f)
        index+(index:enjs:graph-store index.f)
        site+?~(site.f ~ [%s template.u.site.f])
        email+?~(email.f ~ [%s u.email.f])
    ==
  --
--
