|%
::  proxy copied from /lib/naive.hoon
+$  proxy      ?(%own %spawn %manage %vote %transfer)
::
+$  price
  $%  [%price amount=@rd currency=@t]
      [%free ~]
  ==
::
+$  referral-policy  [number-referrals=@ud =price]
+$  record           [=ship =price ref=(unit referral-policy)]
+$  records          (set record)
::
+$  config  [who=(unit ship) address=(unit @ux) pk=(unit @) proxy=(unit proxy)]
+$  update
  $%  [%set-config =config]
      [%set-price =price]
      [%set-referral-policy ref=(unit referral-policy)]
    ::
      [%spawn-ships n=@ud]
      [%add-ships ships=(set ship)]
      [%sell-next-ships n=@ud]
      [%sell-ships ships=(set ship)]
      [%remove-ships ships=(set ship)]
      [%use-referral =ship]
  ==
::
+$  ship-to-sell-date  (map ship time)
+$  available-ships    (set ship)
::
::  TODO: make a "jog" library for ordered maps of sets
+$  sold-ships         ((mop time records) gth)
++  his                ((on time records) gth)
--

