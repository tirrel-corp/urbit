/-  *pipe, store=graph-store
|_  site=website
++  grow
  |%
  ++  noun  site
  ++  pipe-website
    |=  =update:store
    ^-  website
    |^
    ?>  ?=(%add-nodes -.q.update)
    (nodes-to-website nodes.q.update)
    ::
    ++  orm      ((on atom node:store) gth)
    ::
    ++  nodes-to-website
      |=  =(map index node:store)
      ^-  website
      ?>  ?=(^ map)
      =*  node  q.n.map
      ?>  ?=(%graph -.children.node)
      =/  article-revision-container=node:store  (got:orm p.children.node 1)
      ?>  ?=(%graph -.children.article-revision-container)
      =/  latest-revision=(unit [@ node:store])
        (pry:orm p.children.article-revision-container)
      ?~  latest-revision
        !!
      ?>  ?=(%& -.post.+.u.latest-revision)
      %-  ~(gas by *website)
      :_  ~
      :-  /index/html
      :-  [%text %html ~]
      ^-  octs
      %-  as-octt:mimes:html
      %+  welp
        "<!doctype html>"
      %-  en-xml:html
      (to-blog p.post.+.u.latest-revision)
    ::
    ++  to-blog
      |=  =post:store
      ^-  manx
      =/  body-font=(pair tape tape)
        ["https://pagecdn.io/lib/easyfonts/spectral.css" "font-spectral"]
      =/  accent-font=(pair tape tape)
        ["" "sans-serif"]
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
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
          ;+  (body-div post body-font accent-font)
        ==
      ==
    ::
    ++  body-div
      |=  [=post:store body-font=(pair tape tape) accent-font=(pair tape tape)]
      ^-  manx
      =/  title=content:store  (snag 0 contents.post)
      ?>  ?=(%text -.title)
      =/  body=content:store  (snag 1 contents.post)
      ?>  ?=(%text -.body)
      ;div(class "pa4 flex flex-column w-90 near-black", style "max-width: 44rem;")
        ;h1(class "f2 lh-title {q.accent-font}", style "margin-block-end: 0;"): {(trip text.title)}
        ;p(class "f5 gray {q.accent-font} fw3"): {(trip (scot %da time-sent.post))}
        ;p(class "f4 lh-copy {q.body-font} fw3", style "white-space: pre-wrap;"): {(trip text.body)}
      ==
    --
  --
::
++  grab
  |%
  ++  noun  website
  --
::
++  grad  %noun
--
