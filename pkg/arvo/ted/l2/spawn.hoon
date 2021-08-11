/-  spider, rpc=json-rpc, dice
/+  strandio, azi=azimuth-rpc, ntx=naive-transactions, naive, fak=fake-roller
=>
|%
+$  spawn-input
  $:  =tx:naive
      from-addr=address:naive
      =nonce:naive
  ==
--
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
^-  form:m
=+  !<([~ spawn-input] arg)
=*  poke-our  poke-our:strandio
=/  sig
  %^  fake-sig:fak
      tx
    from-addr
  nonce
;<  ~  bind:m
  %+  poke-our  %aggregator
  :-  %aggregator-action
  !>([%submit & from-addr q.sig %don tx])
(pure:m !>(~))

