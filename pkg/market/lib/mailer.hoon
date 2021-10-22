/-  mailer
|%
++  dejs
  =,  dejs:format
  |%
  ++  action
    ^-  $-(json action:mailer)
    %-  of
    :~  [%send-email email]
        [%set-creds (ot api-key+so email+so ship-url+so ~)]
        [%add-blog (ot name+so list+(as so) ~)]
        [%del-blog (ot name+so ~)]
        [%add-recipients (ot name+so list+(as so) ~)]
        [%del-recipients (ot name+so list+(as so) ~)]
    ==
  ++  email
    %-  ot
    :~  from+(ot email+so name+so ~)
        subject+so
        content+(ar (ot type+so value+so ~))
        personalizations+(ar personalization)
    ==
  ++  personalization
    %-  ot
    :~  to+(ar so)
        headers+(as (at so so ~))
    ==
  --
--
