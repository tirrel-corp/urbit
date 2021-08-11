/-  spider, rpc=json-rpc, dice
/+  strandio, azi=azimuth-rpc, ntx=naive-transactions, naive, fak=fake-roller
=>
|%
+$  spawn-input
  $:  =tx:naive
      ::from-addr=address:naive
  ==
--
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
^-  form:m
=+  !<([~ spawn-input] arg)
=/  from-addr=address:naive
  0x6def.fb0c.afdb.11d1.75f1.23f6.891a.a64f.01c2.4f7d
=*  poke-our  poke-our:strandio
;<  nonce=(unit @)  bind:m
  %+  scry:strandio  (unit @)
  /gx/aggregator/nonce/(scot %p ship.from.tx)/[proxy.from.tx]/noun
?~  nonce
  ~|('no nonce for ship' !!)
=/  sig
  %^  fake-sig:fak
      tx
    from-addr
  u.nonce
;<  ~  bind:m
  %+  poke-our  %aggregator
  :-  %aggregator-action
  !>([%submit & from-addr q.sig %don tx])
(pure:m !>(~))

