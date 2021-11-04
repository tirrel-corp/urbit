/-  *pipe
/+  pipe-templates-site-light,
    pipe-templates-site-dark
|%
++  site-templates
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%light pipe-templates-site-light]
      [%dark pipe-templates-site-dark]
  ==
++  email-templates  :: XX
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%index pipe-templates-site-dark]
  ==
--
