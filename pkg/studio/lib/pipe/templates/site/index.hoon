/-  *pipe, *post, store=graph-store
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
        title.sinp
        binding.sinp
        initial
        post
    ==
::
+$  article-inputs
  $:  name=term
      title=@t
      =binding:eyre
      initial=@da
      =post
  ==
::
++  index-page
  |=  si=site-inputs
  ^-  [path mime]
  :-  /
  :-  [%text %html ~]
  %-  as-octt:mimes:html
  %+  welp  "<!doctype html>"
  %-  en-xml:html
  ;html
    ;head
      ;head
        ;meta(charset "utf-8");
        ;meta(name "viewport", content "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0");
        ;link(rel "stylesheet", href "https://unpkg.com/tachyons@4.12.0/css/tachyons.min.css");
      ==
      ;body(class "w-100 h-100 flex flex-column items-center")
        ;div(class "pa4 flex flex-column w-90 near-black", style "max-width: 44rem;")
          ;*  %+  turn  posts.si
              |=  [initial=@da =post]
              ^-  manx
              %:  article-preview
                  name.si
                  title.si
                  binding.si
                  initial
                  post
              ==
        ==
      ==
    ==
  ==
::
++  article-preview
  |=  ai=article-inputs
  ^-  manx
  =/  title=content  (snag 0 contents.post.ai)
  ?>  ?=(%text -.title)
  =/  url=tape
    %-  trip
    ?~  path.binding.ai
      (cat 3 '/' (strip-title text.title))
    (rap 3 (spat path.binding.ai) '/' (strip-title text.title) ~)
  ;a  =class  "link pa3 pt4 pb4 br2 ba b--dark-gray mb4"
      =style  "display: block;"
      =href   url
    ;h1(class "f2 black lh-title sans-serif", style "margin-block-start: 0; margin-block-end: 0;")
      ; {(trip text.title)}
    ==
    ;p(class "f5 gray fw3 sans-serif", style "margin-block-end: 0;")
      ; {(trip (scot %da initial.ai))}
    ==
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
    ;body(class "w-100 h-100 flex flex-column items-center")
      ;a(class "pt4 pl4 w-90 link gray {q.accent-font}", style "max-width: 44rem;", href home-url): Home
      ;div(class "pa4 pt3 flex flex-column w-90 near-black", style "max-width: 44rem;")
        ;h1(class "f2 lh-title {q.accent-font}", style "margin-block-end: 0;"): {(trip text.title)}
        ;p(class "f5 gray {q.accent-font} fw3"): {(trip (scot %da initial.ai))}
        ;*  (contents-to-marl (slag 1 contents.post.ai))
      ==
    ==
  ==
--
