|%
+$  price
  $%  [%price amount=@rd currency=@t]
      [%free ~]
  ==
::
+$  selector  (each (set ship) @ud)
::
+$  referral-policy  [number-referrals=@ud =price]
+$  record           [=ship =price ref=(unit referral-policy)]
+$  records          (set record)
::
+$  config  [who=(unit ship) prv=(unit @) proxy=(unit ?(%own %spawn))]
+$  update
  $%  [%set-config =config]
      [%set-price =price]
      [%set-referrals ref=(unit referral-policy)]
    ::
      [%spawn-ships sel=selector]
      ::[%sell-ships sel=selector]
      [%sell-from-referral ~]
  ==
::
+$  ship-to-sell-date  (map ship time)
+$  available-ships    (set ship)
::
::  TODO: make a "jog" library for ordered maps of sets
+$  sold-ships         ((mop time records) gth)
++  his                ((on time records) gth)
--

