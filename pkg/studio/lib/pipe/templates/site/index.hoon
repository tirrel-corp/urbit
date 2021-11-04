/-  *pipe, *post, store=graph-store, metadata-store
/+  *pipe-render, cram
^-  $-(site-inputs website)
|=  sinp=site-inputs
^-  website
|^  %-  ~(gas by *website)
    :-  (index-page sinp)
    %+  turn  posts.sinp
    |=  [initial=@da =post]
    %:  article-page
        name.sinp
        binding.sinp
        initial
        post
        association.sinp
    ==
::
+$  article-inputs
  $:  name=term
      =binding:eyre
      initial=@da
      =post
      =association:metadata-store
  ==
::
++  index-page
  |=  si=site-inputs
  ^-  [path mime]
  =/  home-url  (spud path.binding.si)
  :-  /
  :-  [%text %html ~]
  %-  as-octt:mimes:html
  %+  welp  "<!doctype html>"
  %-  en-xml:html
  ;html
    ;head
      ;meta(charset "utf-8");
      ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
      ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
    ==
    ;+  %-  frame
    :*  (header binding.si title.metadatum.association.si)
        %+  turn  posts.si
        |=  [initial=@da =post]
        ^-  manx
        %:  article-preview
            name.si
            binding.si
            initial
            post
            association.si
        ==
    ==
  ==
::
++  frame
  |=  m=marl
  ^-  manx
  ;body(class "w-100 h-100 flex flex-column items-center")
     ;div
       =class  "ph4 flex flex-column w-90 near-black"
       =style  "max-width: 44rem;"
       ;*  m
     ==
  ==
::
++  header
  |=  [=binding:eyre title=@t]
  ^-  manx
  =/  home-url  (spud path.binding)
  ;div(class "bb b--light-silver mb4")
    ;a(href "{home-url}", class "link")
      ;h1(class "f3 black lh-title"): {(trip title)}
    ==
  ==
::
++  details
  |=  [when=@da who=@p]
  =/  t=tape
    %-  trip
    %:  rap  3
      (print-date when)  ' • '
      (scot %p who)
      ~
    ==
  ;p(class "f6 gray fw3 sans-serif", style "margin-block-end: 0;"): {t}
::
++  article-preview
  |=  ai=article-inputs
  ^-  manx
  =/  title=content  (snag 0 contents.post.ai)
  ?>  ?=(%text -.title)
  =/  snippet=(unit @t)  (snip contents.post.ai)
  =/  url=tape
    %-  trip
    ?~  path.binding.ai
      (cat 3 '/' (strip-title text.title))
    (rap 3 (spat path.binding.ai) '/' (strip-title text.title) ~)
  ;a  =class  "link pa3 br2 ba b--light-silver mb4"
      =style  "display: block;"
      =href   url
    ;h1(class "f3 black lh-title sans-serif", style "margin-block-start: 0; margin-block-end: 0;")
      ; {(trip text.title)}
    ==
    ;+  ?~  snippet  *manx
        ;p(class "f5 black fw3"): {(trip u.snippet)}
    ;+  (details initial.ai author.post.ai)
  ==
::
++  article-page
  |=  ai=article-inputs
  ^-  [path mime]
  =/  home-url  (spud path.binding.ai)
  =/  body-font=(pair tape tape)
    ["https://pagecdn.io/lib/easyfonts/spectral.css" "font-spectral"]
  =/  accent-font=(pair tape tape)
    ["" "sans-serif"]
  ::
  =/  title=content  (snag 0 contents.post.ai)
  ?>  ?=(%text -.title)
  :-  /(strip-title text.title)
  :-  [%text %html ~]
  %-  as-octt:mimes:html
  %+  welp  "<!doctype html>"
  %-  en-xml:html
  ;html
    ;head
      ;meta(charset "utf-8");
      ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
      ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
      ;link(rel "stylesheet", href "{p.body-font}");
      ;link(rel "stylesheet", href "{p.accent-font}");
      ;title: {(trip text.title)} - by {(trip (scot %p author.post.ai))}
    ==
    ;+  %-  frame
    :*  (header binding.ai title.metadatum.association.ai)
        ;h1(class "f2 lh-title {q.accent-font}", style "margin-block-end: 0;")
          ; {(trip text.title)}
        ==
        (details initial.ai author.post.ai)
        (contents-to-marl (slag 1 contents.post.ai))
    ==
  ==
--
