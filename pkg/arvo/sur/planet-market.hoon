|%
+$  price
  $%  [%price amount=@rd currency=@t]
      [%free ~]
  ==
::
+$  referral-policy  [number-referrals=@ud =price]
+$  record           [=ship code=cord =price =referral-policy]
+$  records          (set record)
::
+$  update
  $%  [%add-codes codes=(map ship cord)]
      [%sell-random-codes n=@ud]
      [%sell-codes codes=(set ship)]
      [%remove-codes codes=(set ship)]
      [%use-referral =ship]
      [%set-price =price]
      [%set-referral-policy =referral-policy]
  ==
::
+$  ship-to-sell-date  (map ship time)
+$  available-codes    (map ship cord)
::
+$  sold-codes         ((mop time records) gth)
++  his                ((on time records) gth)
--

