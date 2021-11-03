/-  *pipe
/+  pipe-templates-site-index
|%
++  site-templates
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%index pipe-templates-site-index]
  ==
++  email-templates  :: XX
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%index pipe-templates-site-index]
  ==
--
