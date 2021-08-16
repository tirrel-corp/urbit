/-  spider, *nmi-hook
/+  strandio
=,  strand=strand:spider
^-  thread:spider
|=  arg=vase
=/  m  (strand:spider ,vase)
^-  form:m
=*  poke-our  poke-our:strandio
;<  ~  bind:m
  %+  poke-our  %nmi-hook
  :-  %nmi-hook-update
  !>  ^-  update
  :-  %initiate-payment
  :*  amount='0.01'
      :*  first-name='Peter'
          last-name='Adam'
          address1='Eden'
          address2=''
          city='Cedar Park'
          state='TX'
          postal='78734'
          phone='7705366921'
          email='nan@gmail.com'
      ==
  ==
(pure:m !>(~))

