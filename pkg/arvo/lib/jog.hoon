|%
++  jog
  |*  [key=mold value=mold]
  |=  ord=$-([key key] ?)
  |=  a=*
  =/  b  ;;((tree [key=key val=(set value)]) a)
  ?>  (apt:((on key (set value)) ord) b)
  b
::
++  jo
  |*  [key=mold val=mold]
  |=  compare=$-([key key] ?)
  =>  |%
      +$  item  [key=key val=(set val)]
      ++  hit  ((on key (set val)) compare)
      --
  |%
  ++  del                                               ::  del key-set pair
    |=  [a=(tree item) b=key c=(set val)]
    ^+  a
    =+  d=(get b)
    =+  e=(~(del in d) c)
    ?~  e
      (del:hit a b)
    (put:hit a b e)
  ::
  ++  gas                                               ::  concatenate
    |=  [a=(tree item) b=(list [p=key q=(set val)])]
    |-  ^+  a
    ?~  b
      a
    $(b t.b, a (put:hit p.i.b q.i.b))
  ::
  ++  get                                               ::  gets set by key
    |=  [a=(tree item) b=key]
    ^-  (set val)
    =/  c=(unit (set val))  (get:hit a b)
    ?~(c ~ u.c)
  ::
  ++  has                                               ::  existence check
    |=  [a=(tree item) b=key c=val]
    ^-  ?
    (~(has in (get a b)) c)
  ::
  ++  put                                               ::  add key-set pair
    |=  [a=(tree item) b=key c=(set val)]
    ^+  a
    =/  d=(set val)  (get b)
    %^  put:hit  a  b
    (~(uni in d) c)
  --
--
