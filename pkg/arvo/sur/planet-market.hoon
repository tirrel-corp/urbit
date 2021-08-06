|%
+$  price
  $%  [%price amount=@rd currency=@t]
      [%free ~]
  ==
::
+$  referral-policy  [number-referrals=@ud =price]
+$  record           [=ship =price =referral-policy]
+$  records          (set record)
::
+$  update
  $%  [%add-ships ships=(set ship)]
      [%sell-next-ships n=@ud]
      [%sell-ships ships=(set ship)]
      [%remove-ships ships=(set ship)]
      [%use-referral =ship]
      [%set-price =price]
      [%set-referral-policy =referral-policy]
  ==
::
+$  ship-to-sell-date  (map ship time)
+$  available-ships    (set ship)
::
+$  sold-ships         ((mop time records) gth)
++  his                ((on time records) gth)
--

