/-  *naive-nmi
/+  nam=naive-market
|%
++  dejs
  =,  dejs:format
  |%
  ++  action
    ^-  $-(json ^action)
    %-  of
    :~  initiate-sale+(ot rid+so shp+ship:dejs:nam sel+selector:dejs:nam ~)
        complete-sale+so
        set-api-key+so
        set-site+(ot host+so suffix+(mu so) ~)
    ==
  --
--
