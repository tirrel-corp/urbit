/-  *naive-market
|%
++  dejs
  =,  dejs:format
  |%
  ++  ship  (su ;~(pfix sig fed:ag))
  ++  update
    ^-  $-(json ^update)
    %-  of
    :~  add-star-config+(ot ship+ship config+config ~)
        del-star-config+ship
        set-price+price
        set-referrals+(mu referral-policy)
        spawn-ships+(ot ship+ship sel+selector ~)
        sell-ships+(ot ship+ship sel+selector to+nu ~)
        sell-from-referral+ship
    ==
  ::
  ++  config
    ^-  $-(json ^config)
    %-  ot
    :~  prv+nu
        proxy+(su (perk %own %spawn ~))
    ==
  ::
  ++  price
    ^-  $-(json ^price)
    (ot amount+ni currency+so ~)
  ::
  ++  referral-policy
    ^-  $-(json ^referral-policy)
    (ot number-referrals+ni price+price ~)
  ::
  ++  selector
    |=  jon=json
    ^-  ^selector
    ?:  ?=(%n -.jon)
      [%| (ni jon)]
    [%& ((as ship) jon)]
  --
--
