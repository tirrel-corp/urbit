::
::::  /hoon/blit/dill/mar
  ::
/?    310
/-    sole
=,  sole
=,  enjs:format
|_  dib=dill-blit:dill
++  grad  %noun
::
++  grab                                                   ::  convert from
  |%
  ++  noun  dill-blit:dill                                 ::  clam from %noun
  --
++  grow
  |%
  ++  noun  dib
  ++  json
    ^-  ^json
    ?+  -.dib  ~|(unsupported-blit+-.dib !!)
      %mor  [%a (turn p.dib |=(a=dill-blit:dill json(dib a)))]
      %hop  (frond %hop (numb p.dib))
      %lin  (frond -.dib (tape (tufa p.dib)))
      ?(%bel %clr)  (frond %act %s -.dib)
    ==
  --
--
