/-  *pipe
/+  pipe-templates-site-light,
    pipe-templates-site-dark,
    pipe-templates-email-light,
    pipe-templates-site-dark-urbit,
    pipe-templates-site-light-urbit
|%
++  site-templates
  ^-  (map term site-template)
  %-  ~(gas by *(map term site-template))
  :~  [%light pipe-templates-site-light]
      [%light-urbit pipe-templates-site-light-urbit]
      [%dark pipe-templates-site-dark]
      [%dark-urbit pipe-templates-site-dark-urbit]
  ==
++  email-templates
  ^-  (map term email-template)
  %-  ~(gas by *(map term email-template))
  :~  [%light pipe-templates-email-light]
  ==
--
