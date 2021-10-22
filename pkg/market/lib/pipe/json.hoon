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
        mark+so
        serve+bo
        email+bo
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
        mark+s+mark.f
        serve+b+serve.f
        email+b+email.f
    ==
  --
--
