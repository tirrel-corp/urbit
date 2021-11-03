/-  *post
/+  cram
|%
::
:: cord escape with hep instead of dot
++  escape
  |=  a=@t
  ^-  @ta
  %+  rap  3
  |-  ^-  (list @)
  ?:  =(`@`0 a)
    ~
  =+  b=(teff a)
  =+  c=(taft (end [3 b] a))
  =+  d=$(a (rsh [3 b] a))
  ?:  ?|  &((gte c 'a') (lte c 'z'))
          &((gte c '0') (lte c '9'))
          =(`@`'-' c)
      ==
    [c d]
  ?+  c
    :-  '~'
    =+  e=(met 2 c)
    |-  ^-  tape
    ?:  =(0 e)
      ['.' d]
    =.  e  (dec e)
    =+  f=(rsh [2 e] c)
    [(add ?:((lte f 9) 48 87) f) $(c (end [2 e] c))]
  ::
    %' '  ['-' d]
    %'.'  ['-' d]
::    %'~'  ['~' '~' d]
  ==
::
++  strip-title
  |=  title=cord
  `@ta`(crip (en-urlt:html (trip (escape (crip (cass (trip title)))))))
::
++  title-to-url
  |=  title=cord
  ^-  path
  [(strip-title title) ~]
::
++  post-to-email
  |=  [=index =post]
  ^-  [path mime]
  =/  title=content  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  :-  (title-to-url text.title)
  :-  [%text %html ~]
  %-  as-octt:mimes:html
  %+  welp
    "<!doctype html>"
  (en-xml:html (post-to-manx post))
::
++  post-to-manx
  |=  =post
  ^-  manx
  =/  body-font=(pair tape tape)
    ["https://pagecdn.io/lib/easyfonts/spectral.css" "font-spectral"]
  =/  accent-font=(pair tape tape)
    ["" "sans-serif"]
  =/  title=content  (snag 0 contents.post)
  ?>  ?=(%text -.title)
  ;html
    ;head
      ;meta(charset "utf-8");
      ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
      ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
      ;link(rel "stylesheet", href "{p.body-font}");
      ;link(rel "stylesheet", href "{p.accent-font}");
      ;title: {(trip text.title)} - by {(trip (scot %p author.post))}
    ==
    ;body(class "w-100 h-100 flex flex-column items-center")
      ;div(class "pa4 pt3 flex flex-column w-90 near-black", style "max-width: 44rem;")
        ;h1(class "f2 lh-title {q.accent-font}", style "margin-block-end: 0;"): {(trip text.title)}
        ;p(class "f5 gray {q.accent-font} fw3"): {(trip (scot %da time-sent.post))}
        ;*  (contents-to-marl (slag 1 contents.post))
      ==
    ==
  ==
::
++  contents-to-marl
  |=  contents=(list content)
  ^-  marl
  (turn contents content-to-manx)
::
++  content-to-manx
  |=  =content
  ^-  manx
  ?-  -.content
    %text       (text-to-manx text.content)
    %mention    !! :: (mention-to-manx content)
    %url        (url-to-manx url.content)
    %code       !! :: (code-to-manx content)
    %reference  !! :: (reference-to-manx content)
  ==
::
++  text-to-manx
  |=  text=@t
  ^-  manx
  ?:  =('' text)
    ;br;
  =/  mod  (rap 3 ';>\0a' text '\0a' ~)
  ~|  text
  elm:(static:cram (ream mod))
::
++  url-to-manx
  |=  url=@t
  ^-  manx
  =/  link-type  (get-link-type url)
  ?-  -.link-type
    %anchor  (render-anchor url)
    %image   (render-image url)
    %audio   (render-audio-link url)
    %video   (render-video-link url)
  ==
::
++  get-link-type
  |=  url=cord
  ^-  [tag=?(%anchor %image %audio %video) type=@t]
  =/  image-ext
    $?  %jpg  %img  %png  %gif  %tiff  %jpeg  %webp  %webm  %svg
    ==
  =/  audio-ext
    $?  %mp3  %wav  %ogg  %m4a
    ==
  =/  video-ext
    $?  %mov  %mp4  %ogv
    ==
  ::
  =/  purl=(unit purl:eyre)  (de-purl:html url)
  ?~  purl  [%anchor '']
  ?+  p.q.u.purl  [%anchor '']
    [~ image-ext]  [%image (cat 3 'image/' +.p.q.u.purl)]
    [~ audio-ext]  [%audio (cat 3 'audio/' +.p.q.u.purl)]
    [~ video-ext]  [%video (cat 3 'video/' +.p.q.u.purl)]
  ==
::
++  render-anchor
  |=  url=@t
  ^-  manx
  =/  turl  (trip url)
  ;a(href turl): {turl}
::
++  render-image
  |=  url=@t
  ^-  manx
  ;img(src (trip url), width "700px");
::
++  render-audio
  |=  [type=@t url=@t]
  ^-  manx
  ;audio(controls ~, src (trip url));
::
++  render-video
  |=  [type=@t url=@t]
  ^-  manx
  ;video(controls ~)
    ;source(src (trip url), type (trip type));
  ==
::
++  render-audio-link
  |=  url=@t
  ^-  manx
  ;a(href (trip url)): Click here to listen
::
++  render-video-link
  |=  url=@t
  ^-  manx
  ;a(href (trip url)): Click here to watch
--
