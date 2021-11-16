/-  *pipe
/+  pipe-templates-site-light,
    pipe-templates-site-dark,
    pipe-templates-email-light
|%
++  site-templates
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%light pipe-templates-site-light]
      [%dark pipe-templates-site-dark]
  ==
++  email-templates
  ^-  (map term email-template)
  %-  ~(gas by *(map term email-template))
  :~  [%light pipe-templates-email-light]
  ==
--
