/-  spider, rpc=json-rpc, dice
/+  strandio, azi=azimuth-rpc, ntx=naive-transactions
=>
|%
+$  spawn-input
  $:  id=@ud
      sig=@ux
      data=[address=@ux =ship]
      from=[=proxy:ntx =ship]
  ==
--
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
^-  form:m
=+  !<([~ spawn-input] arg)
=*  poke-our  poke-our:strandio
;<  =bowl:spider  bind:m  get-bowl:strandio
::  generate a %spawn transaction
=/  params=(map @t json)
  %-  ~(gas by *(map @t json))
  :~  [%sig s+(scot %x sig)]
      [%address s+(scot %x address.data)]
    ::
      :+  %data
        %o
      %-  ~(gas by *(map @t json))
      :~  [%ship s+(scot %p ship.data)]
          [%address s+(scot %x address.data)]
      ==
    ::
      :+  %from
        %o
      %-  ~(gas by *(map @t json))
      :~  [%proxy s+proxy.from]
          [%ship s+(scot %p ship.from)]
  ==  ==
=/  =l2-tx:dice  %spawn
=/  [cag=(unit cage) res=response:rpc]
  (process-rpc:azi `@t`(rsh [3 2] (scot %ui id)) params l2-tx)
;<  ~  bind:m
  (poke-our %aggregator (need cag))
(pure:m !>(~))
