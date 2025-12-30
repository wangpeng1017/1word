-- 图片导入SQL
BEGIN;

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436713_0ea673d56', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bonus-sLn6vvczGw7m6vzSrAxDIamE9BeKhM.jpg', 'bonus的图片', '2025-12-29 17:43:56.713'
FROM vocabularies v WHERE v.word = 'bonus'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_6ff4dbcfa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bond-ZlMMN15N9tVnt7jV0V61mXL9bwP4kB.jpg', 'bond的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bond'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_ed51464b7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bomb-mAGfn70LzwGVI2nEIl5DkCKbBRGVEn.jpg', 'bomb的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bomb'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_83aa78176', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/boast-pG6r9TMrCzxS5i7f25VdD12unaz8sb.jpg', 'boast的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'boast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_9a45cbff3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/blossom-JXUwSSzWTX4Xlk09dRMn6YpBNYQFCr.jpg', 'blossom的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'blossom'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_e0c44b8da', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bless-WKqRhXWbzBViEi2Es4dUNGH4xngGCR.jpg', 'bless的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bless'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_41ffde19c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/blanket-iBUoPNo0QYuy08eNrKTQtcW3K3eeSv.jpg', 'blanket的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'blanket'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_ea677747e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/blank-dTTexHN8Asys41u5Gz7vPrSRdUXm8L.jpg', 'blank的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'blank'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_292a27327', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/blame-2gf9MXrC37TqAJtJ8ZpumXRRF85Sq0.jpg', 'blame的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'blame'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_3b6a5f647', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bitter-0ivHlVqjV22waHX5omZRtplDI8KnkE.jpg', 'bitter的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bitter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_da859de39', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bite-j8LjEGYcGBebYxx78FHh3OAIog3oul.jpg', 'bite的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bite'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_a23453dfc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bind-vKlLwmq1JnyXA5car4YEUjD3uO1gq0.jpg', 'bind的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bind'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_ee810112d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/billion-aeYqdJJFfvLNc7N8fSEhpn7RfDDv5d.jpg', 'billion的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'billion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_9bcfb7958', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bid-fuHlkn5wkDhAe0eC1S4V3wX2LKHyGN.jpg', 'bid的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bid'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_a92244c69', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bias-0ZyvABL9QYWaVv1F8HwNUpx9HmAmlo.jpg', 'bias的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bias'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_77a9a7726', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bet-KaiNFt4VIzxwOyyj84Xm6gzJEJzqEL.jpg', 'bet的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_f1e68bb5e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bestseller-MOwWfjkROjGK3bKXxGpmBHHk5f9WN0.jpg', 'bestseller的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bestseller'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_06a426ddf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/besides-93BoPm4kx7U87Amkb0uCliPG4SQMbZ.jpg', 'besides的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'besides'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_8bfbb13db', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/beneficial-LobQk1MybYmrYjHAaCMwi4V0M8SxzR.jpg', 'beneficial的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'beneficial'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_80dcb64c6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/beneath-i8LoCmAroiYOezoyhxMPj1D5bp6ePc.jpg', 'beneath的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'beneath'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_2531160ab', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bend-k9JWpCZJxENXuCFd7HKjPC4X9iRsAj.jpg', 'bend的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_a843a37b4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/belief-On54GdZC8vpXYcl1J6enBclGpr6yWr.jpg', 'belief的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'belief'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_a01196097', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/behaviour-f3lCSvgGsPFDVi1WZYchQhWVK6nBnb.jpg', 'behaviour的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'behaviour'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_75ad16990', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/behalf-2k41tiM98bdm53ZepWZfkatPyZhQqz.jpg', 'behalf的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'behalf'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_a81ebc8c9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/beg-JEDYMKSRns77DVe5WBUObxvLC5EcuZ.jpg', 'beg的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'beg'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_6904267c2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/beast-6IePjDh6Jgza78zWglNt4a9iLMmBci.jpg', 'beast的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'beast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_f3d4cce8d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/beard-wTbJn9BW3Lr07jcYnpIMetBNd7vGa7.jpg', 'beard的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'beard'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_ff83e117e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bay-S4b6WSkv1neSLkuRCFb4zCBUemUoVS.jpg', 'bay的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bay'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_b22dd412f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/battle-LFywyaV9PwmY2b6p57lezElaOxxJrm.jpg', 'battle的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'battle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_105283a0d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/battery-aV9YnBWGU4F30MRjmyFm8yAiOMJsXm.jpg', 'battery的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'battery'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_ba6331b93', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/basis-w15e2rbDADpwtIxwq9I2z0kdH3bY5c.jpg', 'basis的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'basis'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_dfc7eac7d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/basin-Ib467PcpjLIn91MGo45Otk2KdH7QVB.jpg', 'basin的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'basin'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_b4a9ecf86', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/base-pEn9lk4G6NyIc5vU7SxBM1i1XzJ52k.jpg', 'base的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'base'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_b10585f01', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/barrier-BoZFauMILnxXkIcHJb5RAyaWtTxvSg.jpg', 'barrier的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'barrier'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_605915c5c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bargain-IjFnhHYZFgVddw84PT7dMxjFbquwmS.jpg', 'bargain的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bargain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_c005ae5b2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/barely-UuypgwQlpp00g8Vda6OB9k0xFRpHJH.jpg', 'barely的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'barely'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_0b36062bc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/banner-9DE9Se9npO8j7QEYmgkb6S97GuaAuN.jpg', 'banner的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'banner'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_53d6bb738', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ban-wEYUFhEmXkkEG61Q8Knd78rGL0x8Ym.jpg', 'ban的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'ban'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_bf1eb737b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bake-0WF3bpevWwh90aiEq4mmyNznRVpE8P.jpg', 'bake的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bake'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_17e80616c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/baggage-ISGKdDjyLxKsTmVOEUqrQ1pHdzCh3f.jpg', 'baggage的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'baggage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436714_596d79b34', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bacon-Yq00eCd5kfHhuUKnRGRqXRIqOyARln.jpg', 'bacon的图片', '2025-12-29 17:43:56.714'
FROM vocabularies v WHERE v.word = 'bacon'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_49af25984', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/backward-L0l66bJaeoX2ODNpoa0vcnWIMFLc2N.jpg', 'backward的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'backward'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_8187cfc31', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/awkward-jvzD3vVJD4z9Ypj2SgqHIN6pw1mRJh.jpg', 'awkward的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'awkward'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_b0aeb1c0c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/awesome-OvaGOWSsqkHOiOB12chPstfEEVkmiv.jpg', 'awesome的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'awesome'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_bc718aa47', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aware-lZwIMHGcXRqnck4EjXOY2U9K3CpMnF.jpg', 'aware的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'aware'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_2c71c1e4c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/avenue-67eT2lnN2FxBGV6yWWdXwDJfc6Czqp.jpg', 'avenue的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'avenue'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_eed5171ac', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/available-X6DVdclDdhqopxEUnMVV2Qrau9TGRa.jpg', 'available的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'available'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_bfd66c579', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/autonomous-n1Mjmp2oLdILQNjWqLDZv4JBVgI87G.jpg', 'autonomous的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'autonomous'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_42d1f7a12', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/automobile-5JqLp8JBeNijtcRaa8n7lKGAaJuqhX.jpg', 'automobile的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'automobile'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_067d85ef6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/automatic-cND6DrYRHTD4UPKePFnoRukOZw0BaJ.jpg', 'automatic的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'automatic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_7d1952067', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/authority-pUL9TJ7DU472cIzM8sy1aWgUPkwo1Y.jpg', 'authority的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'authority'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_9b9948d26', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/authoritarian-l1ze53i1Zb7PIwGDR8O5dbo7WErPCw.jpg', 'authoritarian的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'authoritarian'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_e3aa1ab27', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/author-EAhhsNv0YfJ8FyWAy0TxDPL390wxxF.jpg', 'author的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'author'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_73e5767c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/authentic-uSLJGsGRNvQuFXTuoQmDmZ3FOapKKC.jpg', 'authentic的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'authentic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_f3a3f74aa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/audio-IMlJRbKQNwnSx8niSeBJTDJrNOsk6z.jpg', 'audio的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'audio'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_9b41d106a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/audience-4sL3KwG3RgiqyGNvfSweWt1AWCqNmJ.jpg', 'audience的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'audience'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_1ab7138db', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/auction-Gb56Cd0f67lBh3mtSHecAKipzxwXwh.jpg', 'auction的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'auction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_24271d3f5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attribute-nGefdcl9BUa5DVBWfBKP55kPs2fzbq.jpg', 'attribute的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'attribute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436715_51eb01fd2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attract-XNUDnzuCGTEq6D21KVX1qQ1WrHW6Xx.jpg', 'attract的图片', '2025-12-29 17:43:56.715'
FROM vocabularies v WHERE v.word = 'attract'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_5b0e2d7dd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attitude-2I3qc5PtiX9Y7YJWUvZC61ogxZsM92.jpg', 'attitude的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'attitude'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_36bb80a01', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attend-ALelrUyLAhzRrPfbDNK1JTPYKdYYHs.jpg', 'attend的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'attend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_695a2204c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attempt-aiGEhkJ52jQYciy03CjavV2D288c7a.jpg', 'attempt的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'attempt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_734abdfff', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attain-Jlcbt7C8xFwjKtR4y1FXXIJtyILa9t.jpg', 'attain的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'attain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_2ffb1a5f9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/attach-rnRVlR7fffPNX1MAOlac2oJydXm2A9.jpg', 'attach的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'attach'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_26f1e4627', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/atomic-m1ktgtKxGJVj1E4FgO2Qp8AyZXTSYX.jpg', 'atomic的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'atomic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_966e15fc5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/atmosphere-vZdr67mxPpezx4DeopwCD4fYki8W8O.jpg', 'atmosphere的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'atmosphere'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_763a4afa7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/asymmetry-qvCF3Ze8dVjP5TFKvxJSt7WmNuocwX.jpg', 'asymmetry的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'asymmetry'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_b3ce3dffb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/astronomer-Bil5l4cRdYdM8r2JvsYTeXNhAPmA2K.jpg', 'astronomer的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'astronomer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_7771fa986', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/astonish-w7xIiS3Ku6fIf06upuh6YVh3iJn7cZ.jpg', 'astonish的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'astonish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_b586f540c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assure-CLIyDcwgEVfgVVtSZBonAd0ojlw69u.jpg', 'assure的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_dd71ee7b5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assume-k27GFo7BtRR9CFf91CZ4xxyrszBe0A.jpg', 'assume的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assume'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_42350c377', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/associate-deQDqV3VihjGW0WbFJagRWmjXm6eOV.jpg', 'associate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'associate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_701e51114', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assist-B9lD4qqEJKaySUdT1IMJmwHJd3uyyE.jpg', 'assist的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_753104e01', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assign-SR2P3cIDEoTmtlqG8uokMtjf5ZyPU1.jpg', 'assign的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assign'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_95d60e7bd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/asset-igeZb9MF52q2tGdDi4hCUE1cxXCI6s.jpg', 'asset的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'asset'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_ec837b4a8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assess-l7D6ITHRGktBAquqnGV29AfeUUVRnq.jpg', 'assess的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assess'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_54ed04aef', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/assemble-5LYa442fcTrwD95D4FvFF4jBAh9zaJ.jpg', 'assemble的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'assemble'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_bcec0d74c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aspect-e48cgZGnJrQy0yaQIbjVRj3pTabBuy.jpg', 'aspect的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'aspect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_e1723c729', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ashamed-WX6kjMg70FmgyPCr0eu28puPsCpzLJ.jpg', 'ashamed的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'ashamed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_2c512b0e8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ash-6XmHDDL1u29lZEbzOBS2uyXigAGEkv.jpg', 'ash的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'ash'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_fc8052e40', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ascend-YsMyqZ6duxPiNQtXorPlQXhNf9UZCm.jpg', 'ascend的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'ascend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_1ad621479', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/articulate-MErawtlOnzPZ1KtE0z1r0meXDG7fUe.jpg', 'articulate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'articulate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_922af994c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arrow-EZKD7VcademkQuSUYepq0bpPRzn0kE.jpg', 'arrow的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arrow'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_b30fd03b5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arrogant-8ZsAOjSErlzuL2lXpIqHvQErfNnFwg.jpg', 'arrogant的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arrogant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_52529e58f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arrival-MEBqcz1EHZ0b1TCnKUyb5YCVbjefGL.jpg', 'arrival的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arrival'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_f9d5626f2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arrest-ZgpwJyEu26HgXBSSdBkCmwbIsJDafn.jpg', 'arrest的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arrest'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_70249f5f4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arrange-ajP9eOdLxvOIVEZYBRWjvbYGgkXYNz.jpg', 'arrange的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arrange'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_e46355c11', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arouse-1rMVoL7Sc8mI9D5s5CUwx9EWAl5nTb.jpg', 'arouse的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arouse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_67861468b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arise-INRfblAw94Y6U5EmZdl7VXXaPmeWEi.jpg', 'arise的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_9938db695', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/argument-0hwXYp1lf3MACEN7yjqxSBKA17vGwf.jpg', 'argument的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'argument'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_8f22defbe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/architect-nDpWiRHeU38he2JrdoiVcsHweW8VGW.jpg', 'architect的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'architect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_e68602e6b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/archaeologist-dmDQb6x84Ke0cTloWoV9xdcbSI6rVZ.jpg', 'archaeologist的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'archaeologist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_c996a4e92', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/arch-cZnkrWNOaburWyJYB6FBYOm13pLhYM.jpg', 'arch的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'arch'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_4361a8eaf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/approximate-L0SasgmPIFhDH1Tdb8fvEiYwqEhLwk.jpg', 'approximate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'approximate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_79dffff77', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/approve-otECJO9yEJai5sIH51polKmxkeQTgF.jpg', 'approve的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'approve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_c62a2414b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appropriate-gfYT0zyoiTSMEwTSBlFUPO6dtt0Und.jpg', 'appropriate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appropriate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_24a8d53c6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/approach-TX6yMKcmPBWUtPzpRWzWSfgMflcGwE.jpg', 'approach的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'approach'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_c8cde038d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appreciate-Kt5tKQ9rjkmHFYWrUvqLu9Kyg5TLLd.jpg', 'appreciate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appreciate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_9cfa19884', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appoint-832UNuvcHvd2zlg0SEjHEYd1iZRB1P.jpg', 'appoint的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appoint'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_c6e3eb559', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/apply-RDEo3sVVbE5uHd24mh41WLLTPO6wvL.jpg', 'apply的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'apply'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_efc9f55b5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appliance-IKIgs9mTdcYeWhywxAfXiv2vs77msX.jpg', 'appliance的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appliance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_7e88aad0e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appetite-z64mMQj58KbSaadUzZjMK1plCds5oM.jpg', 'appetite的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appetite'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_c2fcd354e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appear-tQpPU1oGcYkav4oAruF760pOZFVS19.jpg', 'appear的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appear'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_ddb79cd5b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/appeal-PYszu71rcBEkfv0cDJSd4MPxRkBMxQ.jpg', 'appeal的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'appeal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_b6ed91042', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/apparent-zedf6EJnppOMmX2twUTL7vy1mBbU1j.jpg', 'apparent的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'apparent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_98ace99aa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/apologize-rHuleAG984kKWTJ5eP3LOyB2qp1z4V.jpg', 'apologize的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'apologize'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_5317e566c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/anxiety-Pjf3IF5EetYlxke3c13TT5qoPLx4Ef.jpg', 'anxiety的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'anxiety'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_82b3584e4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/anticipate-vIr6Krxi1HTV0t9850G28KnJaI0YwF.jpg', 'anticipate的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'anticipate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_b8bfd836e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/annual-cIUzriQ1MdQG5IPq2MfOgK7UDocUHy.jpg', 'annual的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'annual'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_67c06df76', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/annoy-3fGpsMyYLtlv8lSzrBD2uMCUKDRkeF.jpg', 'annoy的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'annoy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_4c93414d5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/announce-qhynLTRnOfaihXzTNeCU5rB7tdmqDF.jpg', 'announce的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'announce'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_a40c7af9e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/anniversary-IkJYEht1Ur8tD2Nlwizd5iVChVE5Ej.jpg', 'anniversary的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'anniversary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_d1ac005ff', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ankle-zYDisKBovH1UqlEI5F1V2DdIY23IDP.jpg', 'ankle的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'ankle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_84f26b210', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/angle-RxTzagrkbOvjr0WLK5vICiIBd9AzfI.jpg', 'angle的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'angle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_23867043f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/anger-ZWqKnDCrXlFsIWsLlMjRWS28ZdZSvd.jpg', 'anger的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'anger'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436716_8236d4a85', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/anchor-YbDANc4zwq5VlPAWdwrMKpbZHAovCu.jpg', 'anchor的图片', '2025-12-29 17:43:56.716'
FROM vocabularies v WHERE v.word = 'anchor'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_a1903e3cc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ancestor-l25R705UgXSbVxrwc3Uz1FOVkPMPYK.jpg', 'ancestor的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'ancestor'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_ddfdd136e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/analyse-WQQ9R8rPj7Cq8JxqKozyX56EmmoRsM.jpg', 'analyse的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'analyse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_e276b6d5d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/analogy-OmYZ1efBEnpSr9pnhBV3cX8qAZmmux.jpg', 'analogy的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'analogy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c2ba523bf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/amuse-RxtGSb9qEQXeGgV6mLYmraklAjQE7l.jpg', 'amuse的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'amuse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_dea73014f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/among-CJ0v7EcorI2bM8uEUwaa4LpdZXbNiO.jpg', 'among的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'among'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_6b3a5f498', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/amid-YyzxQL1EzjOcv5TVlZtrKUuZzJdbJ3.jpg', 'amid的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'amid'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_dff9ded8a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/amendment-I4OJzrLkX4nVAvd5qQkoURqrdy4VY9.jpg', 'amendment的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'amendment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_998b9f5bb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ambulance-ZaoGxE5sMkQ4Sx4jDkz53OMTl0sYzv.jpg', 'ambulance的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'ambulance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_b01323f5a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ambition-DHu0j44TWXFUZWkCiIBDZB2fxumhR2.jpg', 'ambition的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'ambition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_244115d98', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/amazed-2V48E2kCWn2Kd3liTHTHojLHriq6s1.jpg', 'amazed的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'amazed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_86f4ddbb0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/amateur-GxWe0yr14mckYGzVDu2eSvSz0qRsL6.jpg', 'amateur的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'amateur'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_8eb973b41', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/altogether-gYcy3Mx0bXmdMUG1SwhP1RebLFIMio.jpg', 'altogether的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'altogether'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_56d5a68a4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/altitude-mqNRTucqH0dFdlUb0BgZ2mjpYH3Qun.jpg', 'altitude的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'altitude'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c16aa0c39', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alternative-a6hppBVKebUwhRW9FldxrJ8xpP7uJb.jpg', 'alternative的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alternative'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_51af7506c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alter-Gtp778ugBDYkAWkEAp4L4Fd0MLprEA.jpg', 'alter的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_ff792acad', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alphabet-HgZ1pLzFPCxiZ2oN2fZAlQio9O6Lv7.jpg', 'alphabet的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alphabet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_e92d29bdb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alongside-yljZLzEu763Hm3c7t5XxkNKftSqqsQ.jpg', 'alongside的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alongside'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_174c97b95', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/allowance-iBFJDJgJVId2Vm8WBWZRdyPKxDcrBQ.jpg', 'allowance的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'allowance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_6fe51e6c7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alleviate-7XU7Zr6nalPv6VZq0aDtodgy65VVUe.jpg', 'alleviate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alleviate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_a056c3a52', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alike-3797OdQDodR119Md1G4AIWdZMhRvaT.jpg', 'alike的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alike'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_14963d617', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/algae-9MHtMNsIF2laox9g9ESoLyEW2uZsKD.jpg', 'algae的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'algae'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_3257b6077', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alert-JjUYVMjbVUA2yAriVKCiJO68dkwOhK.jpg', 'alert的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alert'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_2247c1af9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/alcohol-v3A7jmtv0lPsQWfrkHQgSsiOlJaCTc.jpg', 'alcohol的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'alcohol'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_2ef62e04e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/airline-cUPIi5M5suLYi1Jnfmw8n3oy0T6aJd.jpg', 'airline的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'airline'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_a76594945', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aircraft-HArtKekOcrua9UOYcFPsfGzhkSER2V.jpg', 'aircraft的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'aircraft'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_6c1dbfb45', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/agriculture-YD23iwHD3jxp63cFBlcG9LBbC2Kn4R.jpg', 'agriculture的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'agriculture'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_270fcdcb5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/agreeable-3uWPXcofLNPcDm59K4ZN0zWhmfFSIN.jpg', 'agreeable的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'agreeable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_29bd3e294', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aggressive-oTrPmeQICQF3vG4pQr2WUwKcojigdX.jpg', 'aggressive的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'aggressive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c3ae0ee9d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aggravate-2vX1tQGtZxkEZX7MFNfATArpPKk3Df.jpg', 'aggravate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'aggravate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_417ee9cea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/agenda-WXx9mu1E3XK8Tu9BosIWSYVlmBs2Ut.jpg', 'agenda的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'agenda'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_cefdfde11', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/agency-EENUDYXeKH4Z4y1MFJ9gaU2bQiZ0uK.jpg', 'agency的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'agency'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c4f23ca67', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/afterwards-ySwOeTfNKR9dOFwRhhTqc9LkcSuvXF.jpg', 'afterwards的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'afterwards'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_ceae38397', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/afford-EBD5YFt66qPzGE5U3WPL28TlWpuQJu.jpg', 'afford的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'afford'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_868d825f1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/affirm-ipKJkrFXKjbczGOSKWZYjKINGRt4fL.jpg', 'affirm的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'affirm'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_2c96a3f76', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/affection-9ywndHTwojKnL6rrmR2WuDGqhWf9xj.jpg', 'affection的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'affection'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_357a7ed72', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/affect-ThPOhhsV52V6L5xzpEC2zDIPP5Mgn3.jpg', 'affect的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'affect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_6aa8d5a27', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/affair-XQLn9IeintjMFgW5JghnQVzGAld8oh.jpg', 'affair的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'affair'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_49d0ae2da', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aesthetic-i0juG0rjV9Ft0KdNQQVg2mkJyqitZm.jpg', 'aesthetic的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'aesthetic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c115276d3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/advocate-mWBA6Biv9Hsl4depmAJ8U7QO7vOeVQ.jpg', 'advocate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'advocate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_97f35bf10', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adventure-oYNupldkg5JlV1CuQSptDMuP9v1r6N.jpg', 'adventure的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adventure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_1043ba10a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/advantage-UMf16zQqf4ILpQQmy4gtOBKJIcpeYj.jpg', 'advantage的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'advantage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_8b9d92ee7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/advance-H4HmsjEJ7c45TDhxTUkAeT4RzS8zXK.jpg', 'advance的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'advance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_b4ff3162c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adore-CYGJNLdtNLEAM1qQx55USDstfEKFqH.jpg', 'adore的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adore'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_2cf5ec48c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adopt-Floueml4cIBxmKwhEXU1Zgc748zPSH.jpg', 'adopt的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adopt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c43f0e764', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adolescent-UbUUI9nEfjRsdh55X9ptCUgphhcgVU.jpg', 'adolescent的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adolescent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_027872b61', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/admit-DeRaXpMOdvOz6lJUxcdIA05SS7shCB.jpg', 'admit的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'admit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_9288fe9d8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/admission-5ddldIOCVm53ywSHwf5hwDVoEwfO5L.jpg', 'admission的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'admission'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_fdb47a520', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/administration-3HQT0pnB1uSndNDHDN96yMI4tSwfRd.jpg', 'administration的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'administration'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_a91f16772', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adjust-pqTHvoMXENzNZL5v92ucqMDNCUAT12.jpg', 'adjust的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adjust'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_3b46374a1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adherence-1FA56rwalTluFRRpcicNqzWbS40GHc.jpg', 'adherence的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adherence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_8dc9b8a41', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adequate-f4Fgwcz232nuxCV7olSqzae82dEz8Q.jpg', 'adequate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adequate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_58980d24b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/address-crU3Ch41U5vyRJUNe7lwWO4IJE4rWM.jpg', 'address的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'address'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_7a44520a4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/addition-JA5Oce3he1wRiAyhBod9Jqyu8mvGdP.jpg', 'addition的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'addition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_3f244c52c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/addict-HBs3AjLajgeADuJBZQLhRArpExIy1R.jpg', 'addict的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'addict'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_f5567498e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/adapt-2T05rB6Dlt5iuGsB1Fdp7sH9QOu1A9.jpg', 'adapt的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'adapt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_b9af53189', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/activate-lQDtCxItl2mGcoUt5zQkw6aOUnoWiI.jpg', 'activate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'activate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_2cb5d47b3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/acquire-zzjKPwlF91PRpGXTpn6TZAldMOBjRB.jpg', 'acquire的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'acquire'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_96d659dcc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/acknowledge-TyzZdcxVbtQNlopVO2dJDON6mjFU6m.jpg', 'acknowledge的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'acknowledge'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_bf66da1a1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/acid-km4sNca1vK3wqVkANGAuGb9J4o6xqH.jpg', 'acid的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'acid'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_4ab193673', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/achieve-5eJlXN3qYaS3wTROWN737QczvrQ9l2.jpg', 'achieve的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'achieve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_388c39d04', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accustom-giJ2PY0t8H1ky1crQeAU2MfzLApyfm.jpg', 'accustom的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accustom'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_14319539b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accuse-RTddfJ3Y6RGE2828yhGy8L5ZpC6fMX.jpg', 'accuse的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accuse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_fce69048d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accurate-YuJwKk2b4e73tzddzwNvegBGfzvhll.jpg', 'accurate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accurate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_1eaf06fa8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/account-3YEX1bT0peFvOjcMSAE2nUi0ejocG7.jpg', 'account的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'account'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_77f01733f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accomplish-j1kBD5o5LVz2NiwqbFozwA2avK2VSp.jpg', 'accomplish的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accomplish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_20a9f721a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accompany-42UyueeNX7xUntm2DGJLL3lIHiiEsf.jpg', 'accompany的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accompany'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_654391647', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accommodate-d7Z875R3lgeVi0QN2DhZDuDnTTFwr5.jpg', 'accommodate的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accommodate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_59bdec85e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/access-XwqpiCjg3PXDabjaG3qv9nEfMaG3yV.jpg', 'access的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'access'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_1c319b619', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/accent-t1XOaGxdmAK9adfF9LhbNhPySBGIOH.jpg', 'accent的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'accent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_3c2f7ae8d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/academic-VDbFWSPYgY7nCKk7fMpf1vST8vRFMa.jpg', 'academic的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'academic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_f5345f273', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/abuse-ELLCb1Yfb3CXEHNEpcxGXwC43PIT5C.jpg', 'abuse的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'abuse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_c08d7d034', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/abundant-Dpjlm35GcpublkESkywdQYRr3aQ2os.jpg', 'abundant的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'abundant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_80826f3d2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/absurd-PtApotS42hV7RuMfBMNm2QqN8UC6In.jpg', 'absurd的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'absurd'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_8f88b7b1f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/abstract-G6hvg6FqMVrGl6mOv5XKmc0bhtshuh.jpg', 'abstract的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'abstract'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_6fe323773', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/absorb-ShCTdD3arIyPUtjq4BXpA3yPmwpswa.jpg', 'absorb的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'absorb'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436717_9969079ab', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/absolutely-WwT4hTSUbOSEc7r92ncWdjh7dwzHNK.jpg', 'absolutely的图片', '2025-12-29 17:43:56.717'
FROM vocabularies v WHERE v.word = 'absolutely'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_329943574', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/absence-20m42QhBjK9eMGLcRxsLp5VNJjUsQ3.jpg', 'absence的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'absence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_e2d1fda79', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/aboriginal-Si4XGCoUxv0l60BmU7uxBE2Y4Iider.jpg', 'aboriginal的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'aboriginal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_d495bd9c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/abandon-dBRSGdUqrs3QkM265a4YazSddxxhU4.jpg', 'abandon的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'abandon'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_1d145d725', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/confucius-WsiGFNc7nX1j1YxeZqKjpxD4y3EzAR.jpg', 'confucius的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'confucius'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_765578c85', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/constitute-RCgHZTzagsvW3MfkaBrPbsDP6rt48d.jpg', 'constitute的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'constitute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_c4b8e46cf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/constant-eqKXofTM7BxzMR6uNvkF75qXI6lbCp.jpg', 'constant的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'constant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_ff1807c05', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consolidate-6xAsbHXdzJejwB2oZIJq8dhpXuzNo0.jpg', 'consolidate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'consolidate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b14c4491b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consistent-UPFx3PhemRKrLX774ACgEF5NDOlFQd.jpg', 'consistent的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'consistent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2e4d0ff33', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/biographical-U0WPR64Vyk0M2WjRznuWz3rbdHbyPM.jpg', 'biographical的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'biographical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_71dd30f54', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/applaud-YwS5k0EYcsJz3HAa3cxdOPXLjwYFvM.jpg', 'applaud的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'applaud'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_c773ad14d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consist-7vA21qvXGpsX0SsQ0tmH4Q0mEwijM1.jpg', 'consist的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'consist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_168631985', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/considerate-eVOPA4lrbCuS8k0Rqa802jxRvcTeRO.jpg', 'considerate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'considerate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_d49fe3c1c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/considerable-jj5Q30iU9RPruwa1Kcz1NfzZwwLEga.jpg', 'considerable的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'considerable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_632aad9d4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conserve-WbAskblU1oiV1gADUXuZ4oE1h3M5Je.jpg', 'conserve的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conserve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_bed1e3a4c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conservation-AwYJBZEU1surginuaylKEr0P1MBzRJ.jpg', 'conservation的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conservation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_e17b7e632', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consequence-LJk1zqr0eBgSwNXvRBwF8g0N6gNy39.jpg', 'consequence的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'consequence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2a72b28d3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conscious-ObT4RLAXKSWQFga4bCAmQfF8yKFPol.jpg', 'conscious的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conscious'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f93db6e19', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conscience-Pl1Y7R1CRbclxBUpFHmOwjbQIEmuHt.jpg', 'conscience的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conscience'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_322435bc0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conquer-miUkC1oJNYb06YnCqBqnXBIREQgzu5.jpg', 'conquer的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conquer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_adf1eab74', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/congress-GfPpmAFhQmen5abWrAhzYTeRWayY1R.jpg', 'congress的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'congress'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b3b83137d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/congratulate-ahPtUfhgcMLBeslJxp0Y1VjgXZueAx.jpg', 'congratulate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'congratulate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_c68c1853a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/congestion-tcnAXcc9Y9c9ia6J6KhPWisK1VmGxI.jpg', 'congestion的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'congestion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_0cc7a3448', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/confused-zjWxB484QqaZHqVyzqPlDvokMjI39u.jpg', 'confused的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'confused'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f4c4311a2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/confrontation-CdWoPdGLulKXB93RNbO69NGqGRum2n.jpg', 'confrontation的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'confrontation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_743d7bb15', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conform-UdQYEU7GcjwJmVtnG98N29lmRldUy3.jpg', 'conform的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conform'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_812f2cbb2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conflict-D4gAv67Q7Yb6q8ogkRHzA0R6jPQkNr.jpg', 'conflict的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conflict'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_9b600869c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/confirm-YV8Wj92vhv0A9ptk4Pmxl2sW34l8nK.jpg', 'confirm的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'confirm'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_85769ce33', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/confess-A11V6cFyiXLgf382rDBC7z4sEXnEq0.jpg', 'confess的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'confess'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_eb034fb6f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conference-p9kL4XxbSo0oR4ynEU45N5PkSYl1AI.jpg', 'conference的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conference'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_7946b3a8f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conduct-N7mIGWfehezAqdPLyoEsIK54YhEtOg.jpg', 'conduct的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conduct'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f8c1cc7e1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/concrete-62TuHzPVk6qAc73FNQd1aSKpnS7Xh3.jpg', 'concrete的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'concrete'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_76005cd64', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conclusion-GSQSvKjJtRnUQHj23pUg3QzKDuhqmm.jpg', 'conclusion的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conclusion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_7e795ea7a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conclude-qHLZnvutmnm2KrYwSo1ysh723s7wfC.jpg', 'conclude的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conclude'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_d5e3c6e1f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/concern-0c0E8q2yBCYeETiK6cOtqjtT0NM36O.jpg', 'concern的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'concern'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_7cd9b27b7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/concept-EhSdOa12w8DVgZqkvi962WYQKn5qZn.jpg', 'concept的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'concept'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_e6aa7e0c8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/concentrate-kgw4wqTWiI0EMCqcnbIwhXi8OKZLce.jpg', 'concentrate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'concentrate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_56f31aa26', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conceal-o4AE6P7pdWBlAzHo6AwcRThl2vsrGN.jpg', 'conceal的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'conceal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_6e52a57db', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compulsory-unVWq587DuswBKhRODkUMWV39MgN9j.jpg', 'compulsory的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compulsory'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_07cc38e2d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comprise-fybFkZr5oeKUhsIY90COU3OKTslqDw.jpg', 'comprise的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comprise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_fbaced931', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comprehension-6rmoGTuKTRknjVIYJMFcbKkanwFo91.jpg', 'comprehension的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comprehension'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2aee592f2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compound-d2mbqv0ZwTftSNTlMSvYnXpIjQc4nv.jpg', 'compound的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compound'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b543d66ae', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/composition-IMfEycrCs4q0QlW249tP7z72XUGkjJ.jpg', 'composition的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'composition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_4573225ba', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compose-E6aMXm8PXbu1Dtq9kJ01txohjs4IXj.jpg', 'compose的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compose'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_35bb12ee8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/component-Pm5LAORf60kwbHwSWC7S4aR06gh02h.jpg', 'component的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'component'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_96520301d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compliment-03NeHAikrURYsMv2kFAmNg8mAEqpL1.jpg', 'compliment的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compliment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_7e27a0b80', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/complicated-AO1VmkhQVW1YKvMwUcpzsGbnfb0X8f.jpg', 'complicated的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'complicated'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_5a3a88c94', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compliance-vNR3ykVUJB6rf2PspGhaDRuNmuDU5a.jpg', 'compliance的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compliance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_67facc3b4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/complex-yStZqUtvE3N5gjR8vpl7q3GWf8nZ7U.jpg', 'complex的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'complex'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_77df3272d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/complain-RLQMOK7nt8J3eckAbfMXPtnlPHxWsn.jpg', 'complain的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'complain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b9290510d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/competitive-VVFQ0okujxukqQfteJJsGP22xZSPB8.jpg', 'competitive的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'competitive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f06360e5e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/competition-W9UOgqE2p1Jx2fKKc8nnfXKozv8hRH.jpg', 'competition的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'competition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_07cb5b1ea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/competence-gj4EwHYuOTuFebL3QA2ElVd70wT7wJ.jpg', 'competence的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'competence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b7dbec910', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compensate-d283kVxk4doUdhssDr23gRKEp7XaqO.jpg', 'compensate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compensate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_4e38d2013', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/compel-Tdf42G6knlK7zV9yI8M9TMJB0e9Dwy.jpg', 'compel的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'compel'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_e4c02dd4c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comparison-7XjAK4HZtwBb4QNyO2sywEnvUsihu6.jpg', 'comparison的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comparison'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_3f117ae8c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/companion-ZsC9dpcDY47N7Coj9m9RUCYoif8hne.jpg', 'companion的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'companion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_a43a86f50', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commute-dc566FQ7fFmtKgrQDeiofDLwnRIeeB.jpg', 'commute的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_c0d5905f8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/communist-rcJTCWytZuO1pB5BqVNIzb2XZwJRRG.jpg', 'communist的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'communist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_eefc4481b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/communication-gxBmQVI7Uq5k2lhSDW6baPOB9I3UeK.jpg', 'communication的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'communication'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f5c6fe289', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commodity-BvRkOiY1KGt1fUpiQIpX7veDBxykdJ.jpg', 'commodity的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commodity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_01ce31014', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/committee-MW7QlchJ9YweIQWWoDdPNJXUo8LLCj.jpg', 'committee的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'committee'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2b34c1d50', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commit-PBvjNd718Wa6Wl8KS6D0M4IL1laBhJ.jpg', 'commit的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2e4ae4b21', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commercial-SQK8Ut9ppfmw3qlDLbsLjPc6pgwUrK.jpg', 'commercial的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commercial'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_bbb2f308c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commerce-i3E3byYwfldSgI5VH8bYAavcT4eo5S.jpg', 'commerce的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commerce'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_24d464d3b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comment-HJMSqtDvNn6J4xRvO2vdcsb9q9CRvg.jpg', 'comment的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_c2000be64', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/commend-wFPNvv8N90JGbDxTy3ah9J6DFA2dAM.jpg', 'commend的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'commend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_33169bb6d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/command-HBS0QeicZqFSjXgBFp3z4jvnO1udWB.jpg', 'command的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'command'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_35471f014', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comic-2FH24nbj2HhxXzlJzDETgzpXnUUiTl.jpg', 'comic的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_708aebc09', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comfort-Y1gK1SuCo4PdcixmSssJL8UviznI99.jpg', 'comfort的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comfort'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_349c1ed1c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/comedy-OVfsk5mZHJWT3lbXKmoXl94FPO5m04.jpg', 'comedy的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'comedy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f523f6360', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/combine-ZLfYIqWXJWjeFABr06MtkgiiCDMnMc.jpg', 'combine的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'combine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_b5bb2c7d5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/combination-cGw0ckrgZHRbVCk0k4sAChBVOI4loJ.jpg', 'combination的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'combination'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_cd12e0373', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/combat-OvuQ34WU2JXbuqRfSDkkJ1kPpPAxys.jpg', 'combat的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'combat'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_909461514', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/column-kv03P8JliDik2AR3pKhZTjiQFyWTmY.jpg', 'column的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'column'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_e43e7e6f2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/colony-Lg3JkPGKKzgwoUPFuZ5QPbyNCgZfWi.jpg', 'colony的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'colony'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_2f847d16c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/collective-SHOrxsKIF2DoDIhiumVR7Zrqh3QrN5.jpg', 'collective的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'collective'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_7f0128cd9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/collection-WvkbTd12OQYAwEHOzy209uT1IKSCWZ.jpg', 'collection的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'collection'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_eb1e1cae0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/colleague-0HdDSp9X8anoMI8jpwBjQH3jbK9LDJ.jpg', 'colleague的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'colleague'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_3604cfdfc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/collar-LR59CQ1qsOinz644kERh8WlP0hVKJf.jpg', 'collar的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'collar'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_70fe11df8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/collapse-ouPHA6OfznldL6KrqMv2UWAgHjTKID.jpg', 'collapse的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'collapse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_5c7b4e159', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/collaborate-wzANnIWPeqUoMgRWxOq1Itb0A9HHo0.jpg', 'collaborate的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'collaborate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_f33c6a641', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/coincidence-uaIBrha2PvXfEoy9895lCyxipP5jWY.jpg', 'coincidence的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'coincidence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_cc9f3069b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cognitive-XSIIit5bslNUaxwstqnHY9su4dK4VZ.jpg', 'cognitive的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'cognitive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_ac5cdc6e8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/code-wjXM3ojAkIhIJoHg4pvrLyG1f01UzT.jpg', 'code的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'code'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_5b1195f44', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/coal-rB3VBClqJqRWTp0QeQushcEhXynHcA.jpg', 'coal的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'coal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_ef62f4e9c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clue-kLFlvlVAL3oO63GKh9XUvU5e78OiYV.jpg', 'clue的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'clue'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_efabf3c51', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cloth-ItbhNlJ6rX8crHnTMhhxt43IzXjl7n.jpg', 'cloth的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'cloth'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436718_bd7c8d100', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clone-3n6FcEZNDls6TprxoqyTVIqLL3WC2X.jpg', 'clone的图片', '2025-12-29 17:43:56.718'
FROM vocabularies v WHERE v.word = 'clone'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_d4bcd7ee6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clinic-sRPE1ZNrYUzwVsKkmMiXNkKx6bOwQ2.jpg', 'clinic的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'clinic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ee3177559', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cliff-7Yxp5tX8DUpe6jDz9WsljA4rtYkRWU.jpg', 'cliff的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cliff'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e0999e9b6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/client-ehUwoBiKqE2xavunRHOjSzkv3o9OBU.jpg', 'client的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'client'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_424cdbd6e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clerk-Vc25Sgg7gVqgiRiYC6vLDz2G1Xs3I2.jpg', 'clerk的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'clerk'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_c48d49e67', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clay-HBItyUII9zdeoWzSFzzd8hmAgT427C.jpg', 'clay的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'clay'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_c73315739', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/classify-LsG22VGFShQ7gMv2f8lbaHoFlgOsrv.jpg', 'classify的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'classify'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e6a6db892', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/classical-S5zjmIEZKNeBf8vBxijxEe5GlueVGB.jpg', 'classical的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'classical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ca1be4deb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clarify-1RlkmX8oY9lOwmgAWyNBvQr9tk34qF.jpg', 'clarify的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'clarify'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_1b2569d85', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/clap-5U7h7PvqPhihQX3zAlwXxjRAoJX1Wx.jpg', 'clap的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'clap'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_adb84453d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/claim-XknwTJuAEye9TeuIDaoNnOTVnqnwhD.jpg', 'claim的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'claim'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_2f9d5a2fa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/civilisation-2MFbL2OecpsgtcRuDdjnZoEhQQhFtJ.jpg', 'civilisation的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'civilisation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_34ac499e4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/civilian-QDzX7Euu4IACgLCC5wvx3B7z4o0uk1.jpg', 'civilian的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'civilian'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_dba63bbd7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/civil-eUVyX7eiQwOMfxxKylPiuY9YO1qTev.jpg', 'civil的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'civil'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_8141050a1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cite-GW46LY4yrR0jFbOxfrYuGCQ2ertCPX.jpg', 'cite的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cite'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e5f9687e2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/circus-2Shut3wpWu8ewxVQxYQvEM5PNV5GKq.jpg', 'circus的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'circus'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_21619dfc5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/circumstance-nQ99KVVOLV2cgUALfGLoRveTfbcpEq.jpg', 'circumstance的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'circumstance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_90102117c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/circuit-tnMgU75T6AqLJXmASScvpzHnBkP3ag.jpg', 'circuit的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'circuit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_21dad329b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cigarette-2ltkwPVwoxohC60Ac6gLMnlyOWklaM.jpg', 'cigarette的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cigarette'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_3c66ea673', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/church-EbpO2yUOQrr1sBhzvmIJ8MBYAl0RQC.jpg', 'church的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'church'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_9d0bfadcf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chronic-HBZY4UjWMYt9ahkgiEcS4QtX6PKG7z.jpg', 'chronic的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chronic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_bfdba03bc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chop-GGu5xwsDJdcHKV1UryHPcPrG9A6WmD.jpg', 'chop的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chop'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_0d1478874', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/choke-19HEapx56dGjH82qrgRsmBD589LLpR.jpg', 'choke的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'choke'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_4161198cc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chief-QB43FUss0jQjXYDevP3IgB33iwt5It.jpg', 'chief的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chief'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_56f54e414', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chew-8aq7alH3Iw6b3zPOdm2mYrcOG7FIYp.jpg', 'chew的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chew'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_a6276d684', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chest-R7ryPRqgIeZDmDua1vV9OBQIJcSdGM.jpg', 'chest的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chest'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_b3e2cbfa5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chemical-q9jxM0z2dSXHn94dnUaHRrseXxb0sq.jpg', 'chemical的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chemical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_4b4d9149b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chef-kTskffev4naiagx4lEXaSGppuCX4VB.jpg', 'chef的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chef'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_151cdd6ed', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cheerful-dC9FpjYrdohwuM7KQ3DxEEgIqqpQFL.jpg', 'cheerful的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cheerful'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_51904144a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cheek-J9mZMWIf2xZOsnqva34LLZ3dxiVjhb.jpg', 'cheek的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cheek'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e42964260', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chase-bV1krUFA5ZuTTDGYwOAJnOoeYeCKCk.jpg', 'chase的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chase'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_206e10de7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/charm-q246Sig4bjw29QATRR3dTdpg5Dms72.jpg', 'charm的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'charm'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_9194442e5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/charge-ZU0gO9jcqKIN3IFmo4ggfKp73g7EOx.jpg', 'charge的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'charge'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_bbd484ee4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chapter-f8i9D30oyE2A3jQlzH1YDRHMTDxwdp.jpg', 'chapter的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chapter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ac036d45e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chaos-xb0CDtiYFylWx1Q8BiapmjQCmHY21H.jpg', 'chaos的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chaos'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_d5cbc3a8a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/channel-oNZPt55NWvv3yKJLkuAjj5MNXYfhQN.jpg', 'channel的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'channel'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_f7e7cd795', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chairman-7qZ6tEBLBgPXZCmog0uTTjTnGdDj60.jpg', 'chairman的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chairman'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_34667a688', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/chain-2CBmB1PBWbXX0SE3uzfUgP2Ufjfs5A.jpg', 'chain的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'chain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_57738452d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/certificate-RyULbmXx1r1aJopR6oWCEGa5jjdVXi.jpg', 'certificate的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'certificate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_92e578712', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ceremony-g361EATjRVBFIFajfdLIcTFAMmCWr2.jpg', 'ceremony的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'ceremony'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_c1ab33ce4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/centimeter-9GHCovzGGGutgFeu611zjCYHAGgT1B.jpg', 'centimeter的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'centimeter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_953772c7a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cell-munKkE1WIgua0JSf9SSxwptyYd9DsF.jpg', 'cell的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cell'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_28dcb1eea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/celebrity-IiF94n4d6mTRXV6mRUNbRfjvfx7Q7x.jpg', 'celebrity的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'celebrity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_1ff3f36b8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ceiling-kMHvz96z0QYSrkIjRFOKW68yJzJQC6.jpg', 'ceiling的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'ceiling'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_40b0df7f2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cease-PCNyvE7mKBYSwIs7NAPJ456xOKJ8JG.jpg', 'cease的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cease'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_cb854b523', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cave-3LlVaaV4PADcFEdGGXCtpYnX838JYf.jpg', 'cave的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cave'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_4c4d724e4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cautious-cQf15ytSvjnr7ERcLKD6WO0aXsha0x.jpg', 'cautious的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cautious'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_208249dcb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cattle-5IIwlrwrzsAKoCaBHkkKH0tAmu0EhZ.jpg', 'cattle的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cattle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_0b388a590', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/category-f0Qkoe8FILVnAAy8e1abklLTuKuc9o.jpg', 'category的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'category'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_7c41e3cd2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/catalogue-rmausXrQEFwXKSYw9Pp89BlrFpysA9.jpg', 'catalogue的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'catalogue'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_b914acdff', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/casual-IMoV2LnnAT49KBZ2zwT77P2Y0B0o8m.jpg', 'casual的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'casual'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_60c1b90e0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/castle-THjTP5z2OKwpZJvuu7p0HC65OSZNnL.jpg', 'castle的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'castle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_68526dab8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cast-ZOE6VWtWzw5x8wcTZTc3OZ8ER4LBz8.jpg', 'cast的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_80f3c989d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cashier-wU0qxi6t4DeDmtfExGWSLQnc2TEaFl.jpg', 'cashier的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cashier'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e087ea891', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/carve-Rz2GlCY0qdA5e9Mr4wzas8G8mKPxbC.jpg', 'carve的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'carve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_19f70cbbb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/carrier-DDsPTgAquaeIl02bOBZ0cB8jeJbi0g.jpg', 'carrier的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'carrier'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_63135d8e3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/carpet-YXnFV5ssQqWtKHKTqqoEmykl4esgTv.jpg', 'carpet的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'carpet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_6c92356f6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/carpenter-wnU5uvNqeqWNxeX17W4HodRNYBjQ4v.jpg', 'carpenter的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'carpenter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_be29d4273', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cargo-LRb68Vkd7G4nrNmifiScH3fvTfiXRu.jpg', 'cargo的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cargo'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_b8c7678ea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/career-KIpFGJV2vl3me2Np1SeWjQH4Z1KP9Q.jpg', 'career的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'career'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_421efe7d4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/carbon-cH9BZ39hdPwykFqdQFC72JmTlHf3kx.jpg', 'carbon的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'carbon'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_2022e1542', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/capture-ornKMjWIGXTzbG9WqnXUC0R1VLDbuw.jpg', 'capture的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'capture'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_33020630c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/capsule-FhLESKhr7Gf7pU5NGh12W9mJLsommi.jpg', 'capsule的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'capsule'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_d62f659ea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/capacity-lkxHdXQjSVrI5pNIIoYfwu9aPjwhF2.jpg', 'capacity的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'capacity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_f7382b520', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/capable-RuFP65HWOTHgOVuugWsm7PnPUj8s5u.jpg', 'capable的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'capable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_cba7a67e2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/canteen-MD6UVpkjrGfeoL5FRK1TzQKqRFymlF.jpg', 'canteen的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'canteen'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_0fa59893c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/candidate-evpCA0YpKs0LDDD7hkbAEJ3EnURYAS.jpg', 'candidate的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'candidate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ec4c36745', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/canal-1n1zdLsf6bvOpRqxZh3zihLscltNwa.jpg', 'canal的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'canal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_bf2bb0fcd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/campus-r9pJrFWiXBuPRRG9cAnJZX1vePxrps.jpg', 'campus的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'campus'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_558a886d6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/campaign-qIVzpuoGglx238SGRn6rWZmr0JCSSW.jpg', 'campaign的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'campaign'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_335421c2b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/camel-c8D8vq5YxPfHn71va21eDlhrTsfxLF.jpg', 'camel的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'camel'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_58c6ab2fa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/calory-2DJSXGEREWGEpELTRqwVn4f1yNT2Pv.jpg', 'calory的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'calory'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_952b9eb86', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/calligraphy-buWImRHfU7mM6zYWuzDRJtrQu3NaD2.jpg', 'calligraphy的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'calligraphy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_2a8add2d1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/calculate-MvVUX2Wp2a7X4oRIRI5K6DoL2c48Ex.jpg', 'calculate的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'calculate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_e10c36277', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cage-nnBNoTcXEY12954tHdPGTCaN2a96P0.jpg', 'cage的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_b63cd7993', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/caffeine-sRsvbkjDzKyPRbw4BjDj55nJcRI65Z.jpg', 'caffeine的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'caffeine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_1464dcf11', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cafeteria-rTycwvTnulELHOoA6vmUm7hxWIDHFz.jpg', 'cafeteria的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cafeteria'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_3e9eb83d5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cable-3VG241OHvtY7snekHsYXj6Feo0zt5A.jpg', 'cable的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_f21bb0a7c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cabinet-1upbtlUMdgieGEnDs56tV37H8Yio6I.jpg', 'cabinet的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cabinet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_a16d697a9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cabin-gKLh5atXPuYBfkGaJAA7cneBRD99JK.jpg', 'cabin的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'cabin'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_4e2238316', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/button-APF84DEiq0XVVcWHqMeAnH3Zkb7LCY.jpg', 'button的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'button'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_03bd91c1e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/butcher-kG3a0c1cjwzVr7nBhbHWPDm1Wc3Moi.jpg', 'butcher的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'butcher'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ff0518dac', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bury-Rt9WwXxzZjcEDUNlz6G9V7MO3JsXbH.jpg', 'bury的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bury'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_2ff020ed4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/burst-SlKCW3DhjZsHSAo804b6VzmE9bDWzX.jpg', 'burst的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'burst'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_48867d210', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/burnout-2SkIbYTU3pAGcLh4hxSYec8CfPHlGx.jpg', 'burnout的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'burnout'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_93c45ef3a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/burden-nJ7k42rZYaiSoziBSDKHh5XHzXTwcT.jpg', 'burden的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'burden'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_2f9371467', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bunch-HOAZT5xWJWdxcGCMsYWCPEEjSdtnpt.jpg', 'bunch的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bunch'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ed034a3de', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bump-AKY67kabmWhr8vdgXf3TvFGN50IzAK.jpg', 'bump的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bump'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_224e1b82b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bullet-7fMToVtMc7co8kxF93ZCX8HpbV46kv.jpg', 'bullet的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bullet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_f2ebc2460', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bulb-2lBZsd6p3ooxRSO4XzGyKBFqHyNkMz.jpg', 'bulb的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bulb'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_30cee65f3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/buffet-lmTJRzqNMZe7XXxBn9wB0Z8IhYQuGY.jpg', 'buffet的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'buffet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_314bb9d5b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/buck-lmBd3klfMLdBsGn2vKQ7PKrVn4wLTz.jpg', 'buck的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'buck'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_8dcf9be4b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bubble-O9MhJTSGvH2q4BzzdJ8RFyjcaYyfYq.jpg', 'bubble的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'bubble'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_029c9ea2e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/brochure-lgfZCmJmzw75r9isSqtNmK97jDK6uE.jpg', 'brochure的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'brochure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_704313c0e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/broadcast-lDYFxcUeFW4AcyHftYtG8UKeZcWFjm.jpg', 'broadcast的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'broadcast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_ab3981d9e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/broad-6t0nnkZks6mHCV9Ge2nL3WNExvw0lE.jpg', 'broad的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'broad'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436719_1097b649c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/brilliant-2sEVzokKFRY9TkgKCjp2OJ9oVRwjnz.jpg', 'brilliant的图片', '2025-12-29 17:43:56.719'
FROM vocabularies v WHERE v.word = 'brilliant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_acbada1e6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/brick-QWThJr4y9DfvK3IAYzmxdJsvMlCcWk.jpg', 'brick的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'brick'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_12cfe9dfe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/breed-UKMMvRW6ELa2Yyv78RF8ZhwWkTU6j5.jpg', 'breed的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'breed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_3d91384ed', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/breathe-W22gYdwV6vlMeG414RG1grZUOMqBY3.jpg', 'breathe的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'breathe'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_b8da5a880', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/breast-yyK0rJHD7sjXY0l6WC2NrwyW47L9xB.jpg', 'breast的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'breast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e510bef88', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/breakthrough-9je97n0B4ROiANc58L8U9m3vgOeNh3.jpg', 'breakthrough的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'breakthrough'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_047e61da7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/brand-YxOp7IGNW2lvkt5vOaDAPgWyASahop.jpg', 'brand的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'brand'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_7b272317b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/branch-il2DmLkVIYr7RHRVsTDm81tFD4uGtQ.jpg', 'branch的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'branch'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_2b583df82', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/brake-XzWnz1lxXj6x4kID0xtZW8GOsdNb7y.jpg', 'brake的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'brake'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_6532ed105', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/boxing-De03U6lczHuhCWIwcx2rVHD3cOpI3F.jpg', 'boxing的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'boxing'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_c4947beba', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bowling-n7gwIw65Ot8zdskzGnrS7IEznnhgBu.jpg', 'bowling的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'bowling'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f7056a94f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/boundary-xXaQ2S7syEaYUbyCQMDI1Z35sF5qGU.jpg', 'boundary的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'boundary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_67c648f3f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bound-MOoAHiRLM7BJ6fRIANMPe51OnUU0Lf.jpg', 'bound的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'bound'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_122154269', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bounce-OclF0PARgR4q28Z2AvLEvtQ5FyvHfJ.jpg', 'bounce的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'bounce'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_0519cbf6f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bother-YePKborXWNiSEAUWOjF7qugB6kL0cx.jpg', 'bother的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'bother'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_fdc0a964f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/botanic-Y2ttHO090VF12rtB3fPXjtuqFxFT6W.jpg', 'botanic的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'botanic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_b66ef34e4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/bored-HRQDn3qRrIKKPQts1rAsEBsOsuRbwE.jpg', 'bored的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'bored'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_b05c83da6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/border-mRnCVCl1bte91tUBawYKCgB739o6K7.jpg', 'border的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'border'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_8667c897e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/boost-IS7HfWZJ6WQcs0iSOLPpbts04Ynfc5.jpg', 'boost的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'boost'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_4989e1bbf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/boom-dZZmFzZnCEvIqFmmlD7eaWFK2PPga8.jpg', 'boom的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'boom'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_3db52cf00', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/booklet-ONowWOsjuRsjMmpw2qeKGpW5hhEYMU.jpg', 'booklet的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'booklet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e46513703', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diametre-YcubhWb65RPJ1ekqvkuE3qxyKajYRI.jpg', 'diametre的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diametre'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_7ee3e1e93', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/draft-jdnPtM3oNtuVFM41ZCcymNej3STpuV.jpg', 'draft的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'draft'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_01bf4d71d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dozen-nqFllCHZsJDFTzBFnFbTz3nd4zTGHd.jpg', 'dozen的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dozen'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_627f5fa81', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/downward-NeBIL4RdfBswIg8NDSBHa934a3wPbo.jpg', 'downward的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'downward'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_94a2218af', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/downtown-1L0FjYDKIOEoKPv4MVctyCW06A4lIG.jpg', 'downtown的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'downtown'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e5182460b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/downstairs-xE6rF1FoXeOdFi87qlZGbEkjwXIS91.jpg', 'downstairs的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'downstairs'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_c7a86eacf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dot-yXnQ6X6lFb29Oy7cvwK40VsParcZai.jpg', 'dot的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dot'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f41ae09a8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dormitory-TXtojhEjq5hKlfvEaig3aBYiGeOWAr.jpg', 'dormitory的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dormitory'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_3b1c5d081', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dominate-NKbhJn76cn2axenQsmxfsUFipEq7Le.jpg', 'dominate的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dominate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_6d40cc40b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dominant-7Hdjm9AHm2kYcHVtEHlm9x9GRFXA14.jpg', 'dominant的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dominant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_3173a895e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/domestic-6jOMXFkiXbjtAzRagyBxKzb5O3IwDl.jpg', 'domestic的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'domestic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e0058c2f4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/document-XRRm6f4v8QuVUmwqyv2aPK6aCznSl1.jpg', 'document的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'document'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_635dd393d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dizzy-JRsjtvjYm1rbDKzD5xhuJ1M32GGGBM.jpg', 'dizzy的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dizzy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f5064f40c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/divorce-mLb8edaR82GbeQ11jriOXA0SWqRVVD.jpg', 'divorce的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'divorce'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e7a34b6f8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/division-3nS1z9jvb1goHovX2aBATcJWiwhPtP.jpg', 'division的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'division'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_6fc53b07b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diverse-wx8UCouOElps6HiMmqiD5QYhjBSHAN.jpg', 'diverse的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diverse'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_841b63c4d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dive-nRcFMY9G29Bpj7dwe9MotTKOg0Hzyb.jpg', 'dive的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_86e02a096', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disturbance-wGQ6hknkndUBLDu4r2PNeNxFZUKqG1.jpg', 'disturbance的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disturbance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_4b8aae0db', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disturb-RGJK9r0uwc33wekF5WwQq8aCznmlQL.jpg', 'disturb的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disturb'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_b35b08af7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distribute-ljuHgkpzONR2isqiuYBkumYh2tYITW.jpg', 'distribute的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distribute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_4689cfe29', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distract-Q8d08LKqxPf6LcbbmJtFmgbFNast9h.jpg', 'distract的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distract'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_4df08ddaf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distinguish-uGpNztph9WZkPx9SCVuBq3NidT8cer.jpg', 'distinguish的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distinguish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_0b95a9051', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distinction-IJxkZLOBvcMWC77oEeazQgZWeHM9QJ.jpg', 'distinction的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distinction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_633c58659', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distinct-s3jW7SBWrg4wKwH6l0W8L2gNInyYRu.jpg', 'distinct的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distinct'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_9bb537fbf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distant-68dd9dGDK3MfofLUHna2h11odixQrH.jpg', 'distant的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_819978e74', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/distance-DwQoictJjd2LfzVWEWQypYpz9PZV0d.jpg', 'distance的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'distance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_060f21c9d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dissolve-z71fm32lsWm4w6B9T7WEJrnr3ZZ6o2.jpg', 'dissolve的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dissolve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_6fadf95d2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disrupt-gyxR0OTE4xrCgSvlV1F5syivhtEqg7.jpg', 'disrupt的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disrupt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_afcfd4549', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dispute-TOS4DArtEOjTDIIj4mTIUL50mVFVz8.jpg', 'dispute的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dispute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e00618550', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/display-rOcb6rkAxuNnJg10DTzR6Z8GmFakix.jpg', 'display的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'display'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_be921c7a5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disorder-6uw1LXq4EfACLdVrutiE6eZugaoRGi.jpg', 'disorder的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disorder'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e59f0c4e2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dismiss-L2PlBuKZikxYZNff6KULaJ9N7R3Hr4.jpg', 'dismiss的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dismiss'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_9aa1d1683', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discussion-vw98AMCkFNPJmhGOLeZnJrxwtlg2No.jpg', 'discussion的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discussion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_cb3148d3b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discrimination-N1Mv9opD3nrTve3BWYJ4UDEnBIBUqF.jpg', 'discrimination的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discrimination'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_c14e18c30', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discovery-yVopeadMOOWkytffg0BqujS3utNKdc.jpg', 'discovery的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discovery'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_273ef1f70', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discourage-sYPVR5ddRyUFNWCJcBjt35ag5YnScj.jpg', 'discourage的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discourage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_8de25f6c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discount-x05TgMRAXWObPJvyFprWT8gD6rkaPQ.jpg', 'discount的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discount'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_7718ec4a0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disclose-uYqztMEkWIdB3scLUF39BNwNtOVV5z.jpg', 'disclose的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disclose'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_ce88a05c4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/discipline-OqH6P6FjdytSuXlb2aBC27nEKhSfPH.jpg', 'discipline的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'discipline'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_fd2eea6b5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disc-QxTRvNiTdE5HfvuRTxdxkSge0msDCt.jpg', 'disc的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disc'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_a8c81eab0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disappointed-IS9ZrVo7MUh8GyVu93aDSeSY6j36GX.jpg', 'disappointed的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disappointed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_6006a9461', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disappear-jrL8Cs7iTggESMU7z0UOpoUj212tv8.jpg', 'disappear的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disappear'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f714d04b4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disadvantage-xL70dL93PEfNmGgmOfc2X8mRocRSmp.jpg', 'disadvantage的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disadvantage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_15314a2a2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disabled-kCW0wtXP6uW466PqvpgOdJnWa3ppyh.jpg', 'disabled的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disabled'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_bd76535a5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/disability-sZgBLeHc8ID8hNtCoSyqFeraQtgLjE.jpg', 'disability的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'disability'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_ef8c86790', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dirt-OOg3RvoLMCta5OcZ4LZKwjD9c12hLD.jpg', 'dirt的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dirt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_ffa5564bf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/direction-ivm8fTFkeCPqyGgGDcK0IGLKoyzfbt.jpg', 'direction的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'direction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_159266178', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diplomat-ca0cYku5m8aiRaHvNyYhKSGwYhyooA.jpg', 'diplomat的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diplomat'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_040680786', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dinosaur-LFKUutSc1vINgkc4McDXmzcjwblkRT.jpg', 'dinosaur的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dinosaur'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_0d61e5a90', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dimension-2TTEkrHv48kSOUGUZtHhXGgCqEj2g2.jpg', 'dimension的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dimension'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_022fdc088', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diligent-7HB32lYFMyfnLTBW9vBSPecyLIFebB.jpg', 'diligent的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diligent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_344f50051', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dignity-Ks14QFU0UkzFfUuSlkhDs5YwwDmjp7.jpg', 'dignity的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dignity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_465123c81', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/digest-x6rc7XxGJvyox2bGsMsMJII4FOWFKG.jpg', 'digest的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'digest'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_037886512', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/differ-PH9ulaI9IFIkFPVwAmCGvEhIqc15ex.jpg', 'differ的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'differ'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_a9fa5e33e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diamond-8m563uW83B1M60kiGLPiPZhLxeo8vm.jpg', 'diamond的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diamond'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_e6f352baa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diagram-DApopTBCgzKfwOKR2xCz6RiTMYn6yS.jpg', 'diagram的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diagram'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_726ea4b92', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/diagnose-fbEhqrnFjNdQ8C5nDjjSrad6Vmo0Jw.jpg', 'diagnose的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'diagnose'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_148893da3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/devote-Pe4ZQnjEIkR5ijO4oJ3CD65fKaBejd.jpg', 'devote的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'devote'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_c9b02becf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/device-8qyyl4NsmVimRcj5IUw8VXv6srWnBh.jpg', 'device的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'device'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_9f2161e38', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/developmental-hM460VhVlJ29JA7fB7w3hCICBbFgyH.jpg', 'developmental的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'developmental'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_27022e48f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/development-TMGVjql7bxbQtR89SrWNd3xrfB5Ixe.jpg', 'development的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'development'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_93565c816', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/determine-iZR4HESdfvTljgcHZs2oZOLrkSQV7S.jpg', 'determine的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'determine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_516930423', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/detect-lLXyAB0PRvpUHLTQsMPhWaUA3zDwyu.jpg', 'detect的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'detect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f60fb2556', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/detail-aR3vyjX22aI2qnevdouwsFIcfIAnTi.jpg', 'detail的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'detail'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_f4cf5d0d4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/destruction-PLksHs2WziLBfoyHW6KNk7PYbDrRWl.jpg', 'destruction的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'destruction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_d318942c7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/destroy-GUbmGrrmv1FiAz58KnZX4CTtNSjNwu.jpg', 'destroy的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'destroy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_77b557ee7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/destination-W7NE3mbxQA40syvRGPvKqcfc0s7wBH.jpg', 'destination的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'destination'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_1ab0188c2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dessert-6iaZw1TgoBTZfLgdmSbBb607kdIl01.jpg', 'dessert的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'dessert'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_0a5194d12', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/desperate-1ZO0gSV6TDWEkcwvgo1Ln4QA6ffNvT.jpg', 'desperate的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'desperate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_12e7229fe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/desire-hptPqrgChLPVZACsSMcfBC4gv5lHCZ.jpg', 'desire的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'desire'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_20e331220', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/desirable-3SZLFMn4ixBY6qpgLbNz1SmwVZbxTw.jpg', 'desirable的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'desirable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_822e7a3e6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/designate-cxQS3tsqNJw59KxUTCmJLlu8GjfGqZ.jpg', 'designate的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'designate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_57f86b7a6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deserve-bClrnwQ5u0P5neaz6mI4dYTdRgc7Sx.jpg', 'deserve的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'deserve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_073412741', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/description-QngMCYx3fGqPd7z7ArnxbzlahK2z8K.jpg', 'description的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'description'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_def1ded6e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/descend-2RZO0EA1G9RJFiKveJFrl8HK7s38T8.jpg', 'descend的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'descend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436720_58d079289', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/depth-T8RKJufkkj9UCOkDiHCCAzltQF24ZI.jpg', 'depth的图片', '2025-12-29 17:43:56.720'
FROM vocabularies v WHERE v.word = 'depth'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_73dfcec48', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/depress-eNicRdggQtCA8UBfgxwMlbS9yaurFU.jpg', 'depress的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'depress'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_1c886faba', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deposit-Oumn3AVXNfJpEVUB0rJuFPFPw7krmT.jpg', 'deposit的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deposit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_016e0fb19', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dependent-jBLp0QjVB2axv9Ec8pSLGS2B14oYv7.jpg', 'dependent的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'dependent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_cf98e61f5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/departure-QwE6aJH1dZIukGd62f45tn4aWk15aw.jpg', 'departure的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'departure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_78f73fff1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/department-7RzLyttfK43J5VHSS7ruqRYXFSAuHx.jpg', 'department的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'department'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_3f0cfa5ef', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/depart-QkW31NwE6fgT62uPx3hGvhofvwiFi5.jpg', 'depart的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'depart'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_7d4d2290c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/demonstrate-kubQFxNDqoE6WuuPX1jLG6HZ2yBFTh.jpg', 'demonstrate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'demonstrate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_d7fb3c5e7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/democratic-9d4n1pT0tBia2Mf0Ka097J0Gi7vZTU.jpg', 'democratic的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'democratic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_9fc30b47d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/democracy-GnZSynJXiuus6k5H2Xhrz6ldlnyyBz.jpg', 'democracy的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'democracy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a4c1f2d1f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/demand-WKpUKAr3UCpNpLGQ62h25t13BC0eKZ.jpg', 'demand的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'demand'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_e28d70dda', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delivery-GhobiMjbJYcy0RDU7JwdH2uNf4nqmV.jpg', 'delivery的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delivery'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_58e95dc25', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deliver-4VJTVyABjsSQtodDP00jpa4rf0jSUb.jpg', 'deliver的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deliver'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_8c02930e5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delight-bFnBZoJvj9Vwc3h9o4t2dRzubX4O3N.jpg', 'delight的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delight'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c2f683cea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delicate-VuS7wvrZNrULUvHYJcyBbosU6gDzbp.jpg', 'delicate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delicate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_179a2429a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deliberate-5DBKKIrbo2KVcKPe7mqmIa2H3wMqfy.jpg', 'deliberate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deliberate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_50861d974', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delete-U7cc7vPBhgZtff6JUj1i2UFQyYttix.jpg', 'delete的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delete'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_2a5f1ae25', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delegate-DqMc0faoSQ20m9dSiFiKsOA9pkXUUS.jpg', 'delegate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delegate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_cbd34d37c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/delay-MA1SimXfczA5Cab1rzw5ppqsBvHn6Z.jpg', 'delay的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'delay'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a5ffee8bd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/definition-JqvtvXjgsH2oEZRAYSdZH8biIe6wIb.jpg', 'definition的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'definition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_e19dbe2eb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/define-XNEnjGtgDZw5n2BZfpQBV3Qdy8mTJj.jpg', 'define的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'define'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_4bbb287ba', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/defend-8uyL1UZvPOIpPxWCvXa16Q7Aj6ssvv.jpg', 'defend的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'defend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_333dd9617', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/defence-Yc6mALeGsO8zuROAwN2o0pPfqvoeLP.jpg', 'defence的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'defence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c92252304', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/defect-YNSrhLGMLmHKYXdirJE7WWbXdzOkdT.jpg', 'defect的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'defect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b10bd006e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/defeat-qs5Jx9WxvDhGjxNLarVBcZt1zkWDUY.jpg', 'defeat的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'defeat'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_9eedc5189', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/default-1KgSbgeq79cY6SdhFEb6RLseKZF1o8.jpg', 'default的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'default'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a98075d33', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deer-qQxB5GFSZ8yk2OotuX8NamUKLwaVwR.jpg', 'deer的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_e00056187', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deed-VXCmr7aYqDmOIbCn99pQ1csmHMrtkr.jpg', 'deed的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_d5536899d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dedicate-paPgnay3CdJNTcpwmK0nNzgRPWJEf7.jpg', 'dedicate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'dedicate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_d4c054351', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decrease-TNdvl4TybLa5ygIUcs9hr598tgNoYz.jpg', 'decrease的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decrease'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_de45b08af', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decorate-WZKYHlZXt2B78uxO7OKfuDLvIGLIl7.jpg', 'decorate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decorate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b683f4a6f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decline-BeOrUSPcH5qSl47GPOwlo0ucvuTK8T.jpg', 'decline的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decline'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_95bc4bd60', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/declare-wuurCIqYKKPyvLubNhSDUYMkGRDmPt.jpg', 'declare的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'declare'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_cee1cd265', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decision-NatPa1RKzKjWdflyGatn4aEXPlxw5W.jpg', 'decision的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decision'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_f989ae4e5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decent-6ZjpZtKaKiaRWwV19CgqpdIVeHy1kJ.jpg', 'decent的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_89c5ba1dc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deceive-rPwGdVw5pj82HWLr0ZCg1zDrohcTPR.jpg', 'deceive的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deceive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_5ae494f7e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/decade-TYcTnh1bJs3ki4KcrqunZPREKcYzip.jpg', 'decade的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'decade'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_04d24b767', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/debt-ACpanAaMq8uVLTu2IKgPwo60aU2GIg.jpg', 'debt的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'debt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b54a6af15', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/debate-b0IQXabP2PjezrbirrC3khlEzJGeOj.jpg', 'debate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'debate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_0eb0d5cee', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deadly-2gXcIngjzkVWwYzZ8a7Pr0m45PytYU.jpg', 'deadly的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deadly'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_9574a7599', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/deadline-nEOlt1ox74TYn3es9LTye6YNNXeXud.jpg', 'deadline的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'deadline'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_5ec8d48ee', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dawn-V6VCTWKgdDcOm4FjC3iBUuoHoLZVuX.jpg', 'dawn的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'dawn'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_85d01386f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/database-diuF1KKm7LefCSBiW1ZT9iEW1CjvIN.jpg', 'database的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'database'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_d12189779', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/data-8wFdC4JjgVL2Hp0RcPq8zHjW9zPbxp.jpg', 'data的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'data'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_5290d088d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dare-gxwOKxIezyI4PqxvjEmKfnvXFW5CHc.jpg', 'dare的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'dare'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_17c402667', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/damp-sPxLrLWmTeAn98iLcadXq8fA6XMBl8.jpg', 'damp的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'damp'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_06f05f772', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/damage-umXxsuOgGcDyakKiiQRON9teLktSyn.jpg', 'damage的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'damage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a863d0c90', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dairy-QTLl6HvIDq3eLn4HhxC3pfMRXrQtfR.jpg', 'dairy的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'dairy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c1e7165d6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cycle-cksGhGzE9VQXbVcYUOh3reZuGSbSPD.jpg', 'cycle的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cycle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a6ae2414c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/custom-8uqjKk8dIuJtIJFVV7MxoivXXXUoaS.jpg', 'custom的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'custom'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b3727b344', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/curve-JFgo7L8lOyEwG7Z8cG0lHSwfZH60dL.jpg', 'curve的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'curve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_4f8683fda', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/curtain-sl6UOMZ1guXZXbhNyx1ZCrPhaF6oe1.jpg', 'curtain的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'curtain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_180a54575', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/curriculum-6scqPuBPOgKeLIYL0ybpjLbG9BW92p.jpg', 'curriculum的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'curriculum'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c37ad93fe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/current-LpHQpfQkzxMUnKkwDhUzb84aq0wKpB.jpg', 'current的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'current'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_62e93af9c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/currency-LsbJKZlA23LdLE8PChIuxUdCeRYaok.jpg', 'currency的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'currency'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_00f4758fe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/curiosity-zKM6f0AZjygliafZESVIK4bMnUrROA.jpg', 'curiosity的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'curiosity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_603144741', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cure-XQl68RP1cvsLHJonhnAJ15fSp06tWd.jpg', 'cure的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c2f51f8d5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cupboard-Dv6iWnlm59ubTebhpSXf4Tv1vLYJtb.jpg', 'cupboard的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cupboard'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b90863e39', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cultivate-322y0Op2MO2jwZkLZ5em1kNA7ZTnbK.jpg', 'cultivate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cultivate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_0cb8053b2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cuisine-W4QwLIMWTeZ6Nu8jLJJHaufdiLkbyA.jpg', 'cuisine的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cuisine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_64bb6e095', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cue-MWyUK1Lv2vevUwQAW2WG05HZpo7AfV.jpg', 'cue的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cue'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a1e02437c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cruise-fMG6XlFFBg8eAamvxAjUFXQSskLKQf.jpg', 'cruise的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cruise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_fd0a56103', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cruel-3ieqyIMJpWiHt10oJwrBWnd7wE4PBD.jpg', 'cruel的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cruel'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_097114b0e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crucial-Kmoi45MBDXZ5YGgkv5W4eBLRQR1QXO.jpg', 'crucial的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crucial'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_b365843cc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crown-KU2MqPv7lGy0VtAhOwVqKJfWFoVEyH.jpg', 'crown的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crown'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_0e05cdbdb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crowd-C3qDHLekHrTn2g7UR4K66GdRKlIbv7.jpg', 'crowd的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crowd'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_5ca064fb8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crop-8fXLm5CAbOv9QE84YTZCR2TgSb5pvo.jpg', 'crop的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crop'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_488f68a9f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/criticism-nqPVRBnjeIwEp4l8BW6yx8uBt0NkgP.jpg', 'criticism的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'criticism'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_a6374ffe3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/criticise-G3XX50DSME1M6lEd8CJVv5b0YAZjCs.jpg', 'criticise的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'criticise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_d7198955b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/critical-0y0rVl5GYA9DocrBbcAaU5nK41iO0r.jpg', 'critical的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'critical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_ead4480d5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/critic-xDPTFQJO8ElOt96uAd4oT4ZV1BfTPb.jpg', 'critic的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'critic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_225e11796', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/criteria-PibPWAOSHClrft8eiOuL5jjvEgfEZE.jpg', 'criteria的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'criteria'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_e58262f9a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crisis-8lsa6lyD8OucjmRePVf8wxHu788hPV.jpg', 'crisis的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crisis'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_7d78e1532', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/criminal-YQXx0aLnf6rOb4pCDfGyjdmAuOjNn2.jpg', 'criminal的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'criminal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_ccd88597f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crime-kPrdv3hGvBaRvd4hpRZRGCHASfslJi.jpg', 'crime的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crime'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_35a60c740', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crew-0mRw1Ycpc3SzDn3OaaYgLHsH437AxX.jpg', 'crew的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crew'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_f094bdc68', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/credit-bmW2bxk9Eb1eQXUX6xhyYQC2DqS0df.jpg', 'credit的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'credit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_1e6c0ccd1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/creature-EtlLphssM9qpdJLOE5VAAwse8IHx57.jpg', 'creature的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'creature'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_0e9d8267e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crawl-aQ2ToMxG5LP3cJjkY6yT0uQ8runn8l.jpg', 'crawl的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crawl'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_bb18daee2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crash-1DrtwnrukujorNG2XwvsomGjJbEe63.jpg', 'crash的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crash'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_49b9a54b7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/craft-S4y7X8bgsD4HfXrJ1fPSBXLTrXlctZ.jpg', 'craft的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'craft'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_0be7aec28', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/crack-ED1WRYe42npyvPGDvXSCVqTwGurnXD.jpg', 'crack的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'crack'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_571f4ae59', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/coverage-JJwxVjkRAZJhqWrhcP9NVr7tQeh2vE.jpg', 'coverage的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'coverage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_fdb88b7fb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/court-mnoxwX2Y7I3WI4A163PMTsQwMWWIlF.jpg', 'court的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'court'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_298512c0f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/coupon-ZuHOyoftkqgizq8kJhV65tB5wYbFF7.jpg', 'coupon的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'coupon'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_139147972', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/counterpart-AeKW998x7Q6LZnxkX0j0TOILCihb63.jpg', 'counterpart的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'counterpart'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_41b0d4faf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/counterintuitive-LnNV7sOKuOpWwHqcea6J9VkKjKcB0g.jpg', 'counterintuitive的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'counterintuitive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_4b4af1ed4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/counter-Jq1vJ3Xwfa6wojnkPQw0gLwqTQ1tno.jpg', 'counter的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'counter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_8bef3d209', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/council-7Kb0RRo8yew1pzi4LPgwQeZssFtahI.jpg', 'council的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'council'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_f074a13e6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cottage-ntp4E9Myil5CIBlVGkMgohUJftVtih.jpg', 'cottage的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cottage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_e45b4de4e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/costume-a16llB5SkBKtlRkbkH5iQ5N6I78LQ2.jpg', 'costume的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'costume'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_228788079', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/correspond-IBag3XMHiPhnF7KVn7oxp1uluw8Byf.jpg', 'correspond的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'correspond'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_584c03212', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/corporation-ewYbwNgEDREq5eAHM7MQtgJpjG9x4k.jpg', 'corporation的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'corporation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_5f01ca989', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/corporate-VXTaZ05jQBZkg1Mjnj8VcnRfX99txq.jpg', 'corporate的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'corporate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_918af19b8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/corn-tcOpyDhwiu4ImiXnOs2aAzaUk9wNxF.jpg', 'corn的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'corn'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_44ebf06a4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/core-9FqgaCSiQ6uekdxuKjBv3jXIVlngWq.jpg', 'core的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'core'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_82317d5ed', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/cope-HHBnPLWBVs7uDyNBMQRaNgH63sjRa5.jpg', 'cope的图片', '2025-12-29 17:43:56.721'
FROM vocabularies v WHERE v.word = 'cope'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436721_c1d4796c7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/convince-fgKqDVQkRRXIuZeVGVPAKJHvv8PPpX.jpg', 'convince的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'convince'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_7cd5d67eb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/convey-iBNOcpTtJwTf8TtmuXlgbvymBzdRDB.jpg', 'convey的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'convey'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_8673fe156', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/conventional-BK6DP7Zsu9nKN4ydoLnse8Ln4q8aGn.jpg', 'conventional的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'conventional'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_49a9abfd0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/convenience-Q7VARzzNyqtrOYCmZzgPPnYxxGfhOs.jpg', 'convenience的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'convenience'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_e327b7bf9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/controversy-RLyR4A3I7ho2yqRdDkAyN2DOCvYLA6.jpg', 'controversy的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'controversy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_980137214', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contribution-IoFQXTNlZnrPISCcd4fBIhC8XYKqur.jpg', 'contribution的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contribution'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_713be1e19', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contribute-3XUyClRsownqp88yPMzx28B4Vv5SiI.jpg', 'contribute的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contribute'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b0852eb96', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contrast-5NNrf3NbQnMSCWKDfQOwX7yW13EwP1.jpg', 'contrast的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contrast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_062742b40', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contrary-YUfWzF1qgizfkoPlxNMOcQi2mzaayN.jpg', 'contrary的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contrary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_e680b92b0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contradictory-tvfkbLa04AMktm0UscwvYvvNcqUEHV.jpg', 'contradictory的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contradictory'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_961028248', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contract-yn8HsxglZUYaWrllxkTzXMMJ1JpzB8.jpg', 'contract的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contract'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_e995d676e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/continent-cSCIAD8i1bnFb4LBxgqttvKGQShQgH.jpg', 'continent的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'continent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_4e3d358e9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/context-1eyLW13oA5iZSvRgfgIkVpKOgNoXoc.jpg', 'context的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'context'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_21ea95360', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contest-mdxXOsmeA6qSVEHdr5TnpCfvDQuM6f.jpg', 'contest的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contest'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_41b3f1038', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/content-VNe9CtapqbPmeWAxonJMeth0XxM75g.jpg', 'content的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'content'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_9b08f3ed7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contemporary-9JIrEh3dm4XFvWvrPC3SSslqFh0mXG.jpg', 'contemporary的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contemporary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a690d6583', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/contact-Ap6ElyLkRfW831Zti2lZQwK44uAACg.jpg', 'contact的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'contact'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_7aa01ea06', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consumption-LumnT9AAJOlzpGWgLDezgG9fsPIulg.jpg', 'consumption的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'consumption'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_799219add', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consumer-2WW8bAcv8syjeSO5iUKZcAxXlcutZJ.jpg', 'consumer的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'consumer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_26d5c8722', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consume-SsY6zYTHlANmRmNhRrmJI2aaF2TvVV.jpg', 'consume的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'consume'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_bd5b01145', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consultant-zezfckEbgkigq7mogTh0TeRerjpvzO.jpg', 'consultant的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'consultant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_ce60ee8c2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/consult-3seDTQ5PmDPeLPB9v9uLESvR8aWxxN.jpg', 'consult的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'consult'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_fd5e4f2f0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/construction-CxyYrC2FljtCtatm6uKh9nAGW93gB0.jpg', 'construction的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'construction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b84b8db32', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/construct-UfTpReTXklZeNwfhQDT3IXDdoMoOIc.jpg', 'construct的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'construct'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_d74660466', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/constitution-saHKr1Jq6oQtIwd24GYOqESY19LlMo.jpg', 'constitution的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'constitution'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_f4573b5ea', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emphasis-caKJyrXosVuyDKCf3uurg1LQ19NEKP.jpg', 'emphasis的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'emphasis'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_124dcbcb0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emotion-Ifg6XCrv1Tfn4n72mLLTrsDdECssQ5.jpg', 'emotion的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'emotion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a3b80b53b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emit-ffADzt1PIeTYIBE4EhtBAvf7tMkVQQ.jpg', 'emit的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'emit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_ea7fe17bc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emission-JTrzwfGsZYM258IUwysYeiO0aROtYS.jpg', 'emission的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'emission'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_1e0555c8b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emerge-8i3jO7xUMx2UQty1JdYLs4DWa4ownf.jpg', 'emerge的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'emerge'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_033a4c1ca', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/embryo-FsFq2pcymitPUmYdCEeowTIZHCpnrz.jpg', 'embryo的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'embryo'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_910cb149e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/embarrassed-sE7f93V04UJUNADp39Tfmq9Vn5yVAm.jpg', 'embarrassed的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'embarrassed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_073595fb8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/eliminate-SKkrOr8ZZTKSpIhguTrvJWYM1ElweV.jpg', 'eliminate的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'eliminate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_6767e97fc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/elevator-rlzLea3l1fJU1iaAIbw1DPBzAbjXrk.jpg', 'elevator的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'elevator'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_ad592d690', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/elementary-bVUAe6cBEpX0gpaMKjK2M1mXdUuySV.jpg', 'elementary的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'elementary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_f37bbab5e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/element-HEXTkrLMKEKXprZ9GmwSQOvGKUuIhE.jpg', 'element的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'element'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_0d5fcefc2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/elegant-eN5fdF3qb0pU6n0UwIxEjD3hOkB3EA.jpg', 'elegant的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'elegant'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_45257aa85', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/electricity-YIlu7637l3CoWtoxnqZR95PHeYwQL3.jpg', 'electricity的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'electricity'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_86acd68c3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/electrician-9PfH6St1E5k6lqK9v9dnmPggcJB0ib.jpg', 'electrician的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'electrician'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_2d09790ed', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/electrical-xLNWYT9kIT96Q35mjrYfDgLY3YxP7r.jpg', 'electrical的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'electrical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b469cae43', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/election-YSbP2KAStFhoOG8mWfmBsrnnng8Yjb.jpg', 'election的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'election'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_18c3b8d1c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/elect-8QN0GJ1J0I3jQVOPpRutblAQoFVcre.jpg', 'elect的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'elect'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_6a2041647', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/elderly-h5dBB6BsGbFmv9yYMb2WFEMmpOlhsp.jpg', 'elderly的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'elderly'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_e81019c08', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/efficient-YOYlDkkW0e4UJoqGHwCbLchPtKq7uE.jpg', 'efficient的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'efficient'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_6f7f4379b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/effective-klMdRPXoYFCHpBslcoEuKIvkiENCVs.jpg', 'effective的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'effective'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a9b540bf7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/educate-OZS67xt4amhxr4eKiXLCNjCnDsu5GU.jpg', 'educate的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'educate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_d9cb6f55d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/editor-ZZxFZGtDz9QlsV6Rx1IHUbMmmGHKGU.jpg', 'editor的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'editor'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_560c8e1ed', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/edition-K97Qt9dnXErSr4hILYcnwbKNRr7C6o.jpg', 'edition的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'edition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_793d93947', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/edible-I2lVxMfBXYME44h5YTZvQxzCY2UaCz.jpg', 'edible的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'edible'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_eb493ab05', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/edge-zkpovlI071d4odRDi2LXzPe7Q0JJmT.jpg', 'edge的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'edge'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_189a6d59b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/economy-DCldczzWF0O7669mYFijsmS3aQcmon.jpg', 'economy的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'economy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_1b02e628c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/economical-Hu6OyG3L3OkKS99Y3cTeJ5VZcE8H8G.jpg', 'economical的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'economical'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a804a57f6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/economic-eoisAEBkmmuZi61yNY8EVeTkFRydcJ.jpg', 'economic的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'economic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_051274bb6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ecology-IMBIz4hDiboYEyAOKHI0s5cuWxlj5W.jpg', 'ecology的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'ecology'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_f6c8720a5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ease-rdPRqdWyqQLVZqs0YJfSH9dbC8G3aA.jpg', 'ease的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'ease'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_1cbf59056', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/earnest-3HbcQvNHk7voZ2B7nYvov0EtLEcyqc.jpg', 'earnest的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'earnest'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_74af0fd73', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/earn-FMdx1YAoQfY6NxfewkDHPH2yz13neS.jpg', 'earn的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'earn'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_727d335b3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/eager-VguLIaRvTjUIo9agBQhfdvyOO7u9z5.jpg', 'eager的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'eager'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_0f9f60668', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dynasty-ePpqFImf5krlnIFZH30rTGt7uoMBVB.jpg', 'dynasty的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dynasty'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_8a5a8ef25', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dynamic-ueY2DJ9MSZ27S0dn5xkKDMTgwP8tVc.jpg', 'dynamic的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dynamic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_74cb7ea71', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dwelling-vNzsfy8WD4KU5D6pvFGFlKlm8kAdzr.jpg', 'dwelling的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dwelling'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_35028f099', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dust-ooBf7Mrqkjcza4B1Y9Zoj80KHsAuNX.jpg', 'dust的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dust'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_bf1d46b46', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/duration-ZlzWOwjDbolqhQZJG0uax3rp0xc55Z.jpg', 'duration的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'duration'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_5b1e726b1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/durable-VIYBp9dBwI2Yl7mxnTxyYv8Y3aCw4m.jpg', 'durable的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'durable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_9c3f755e1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dump-Ob9atzE6eHozP6aBqSGQSdZbxTSy9e.jpg', 'dump的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dump'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_40e24fc38', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/duly-rwlUKlXCp3IbNnh3Yjo09ybPtAp5KP.jpg', 'duly的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'duly'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_92aafc42f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dull-AM2hA0ZOpAPPQUidnTiNwl5Vt0uEVB.jpg', 'dull的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dull'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_e7a03a062', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drug-fxyFO3mTGt1NHnXOgZLiSptxW1U9ff.jpg', 'drug的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drug'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_297d752b1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drown-vad6olCcf5nFZUQJs8b8Ry6LwkBKue.jpg', 'drown的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drown'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b0e35b583', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drought-dhtMvFtVMfv0cbAif0o2aGZYtkzUaE.jpg', 'drought的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drought'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b4d989589', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drill-bZa3073nkCDDF5KYkqSuVh7O95ZTH0.jpg', 'drill的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drill'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_5eb5e851e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drift-Ck71GSsSammLfWCPpWRTQMSElTKFiz.jpg', 'drift的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drift'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_4ca578ee9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drawer-4gTjGL0IJ1jIz60YYqQIwdq3wQkXBw.jpg', 'drawer的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drawer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_2c3ee9a4d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/dramatic-BaJqmCb6iFCrL9aYn0XZ5hZMQiE4Ds.jpg', 'dramatic的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'dramatic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_3823ec990', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/drag-Y6tSjalJISIaQ6jI8FX2tB9zz8EYWy.jpg', 'drag的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'drag'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_f5ded9875', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/gap-enM1raudUdrmhK0BukU2MqmmZhYORd.jpg', 'gap的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'gap'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_786884c53', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/gang-oJ4hBXOhtetVq4MAXaQ6H6WSC7G35W.jpg', 'gang的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'gang'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b1c23126f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/gallery-ySpnDkPMExJu8wGsoGyt1tI2iXNmvb.jpg', 'gallery的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'gallery'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_fba809a8e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/gain-14PSPUPPKrsUpJgK1AIuIEkXQYbGSy.jpg', 'gain的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'gain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_1e82baf4d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/furthermore-pgfLaO5NvP5c7yVr5Yiq4mZAwJehNm.jpg', 'furthermore的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'furthermore'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a12fc7ec0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/furniture-b0uHaKSMDHZA5TG42GEy33dxKAwFfB.jpg', 'furniture的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'furniture'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_1aab5b14c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/furnish-FOiKYVoJebu88ek5P71iItpNDjBuDh.jpg', 'furnish的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'furnish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_ef468e03d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fur-paiPS6io7M32ZJmF5DndPDNqRbQrJG.jpg', 'fur的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'fur'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_5cc33f0d6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/funeral-Nbxvj4fK2yNWYztgOg3vc0pM9rzXBL.jpg', 'funeral的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'funeral'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_92bfe087c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fundamental-daxb4ZSPJYDHFjBU1Lez8dIoaVtJCW.jpg', 'fundamental的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'fundamental'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a5436f941', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fund-6Hxfanla5jaQPdL3Wy5yh9a7SDHwtA.jpg', 'fund的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'fund'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_9aa912da6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/function-7X6NQ7NIdlIncg4N2ucCDxoIupwfgQ.jpg', 'function的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'function'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b058070a7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fulfil-ixGIakAcxDgtRZ2ojyDjSAgaDMBj0w.jpg', 'fulfil的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'fulfil'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_07a89e00e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fuel-oyMqrfbbioI3fIStjCHPVTvfwe0UPs.jpg', 'fuel的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'fuel'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_b92a1413e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frustrate-df2VIDQEHI5whuwqWwnnMYUYwOFGNa.jpg', 'frustrate的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frustrate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_a17843c6d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frost-PvONsIEiXGLPSrukTmrKZ1dSrSKeBC.jpg', 'frost的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frost'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_3a672282e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frog-ErRqkVf4TF7SGwjY1tE0JnAHOz4VJW.jpg', 'frog的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frog'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_471843941', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frightened-njLqN8jK9gIsY2SD1XKRBYFgY7Qy9V.jpg', 'frightened的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frightened'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_910c0917f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/friction-pO5j9Lw0Y3nvlnTP1hUuoMtQFcz7i4.jpg', 'friction的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'friction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_50a01bbfb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/freshman-XWrUPDZR7p8osz7V4G0N3YjX2wqLE8.jpg', 'freshman的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'freshman'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_8c2965c81', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frequently-1NTxd6sFRwT5tCocGRQiJT5gsa23oo.jpg', 'frequently的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frequently'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436722_59c8efff7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frequent-OS7QL8GYQznasSpgIaCu9Z3cKnhfhJ.jpg', 'frequent的图片', '2025-12-29 17:43:56.722'
FROM vocabularies v WHERE v.word = 'frequent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_f1fcef81b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frequency-eJ98O12pYGCK18ACNdzrDUR5ja3vQl.jpg', 'frequency的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'frequency'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c881f4b2b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frank-ujntkVyDRRU6cTtZPtUVdc3KYTvdCP.jpg', 'frank的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'frank'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_dfffc3660', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/franchise-nsoCNq0GYgt7wTdTkaXFGEZ7dGmJzl.jpg', 'franchise的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'franchise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c39251a92', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/framework-ui4JfpHwDsjgkUpaWSSiTUSGwdy7eD.jpg', 'framework的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'framework'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_3cb1df182', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/frame-E9x4vOp2kq8j1CtOU1HKZp9ugKuBWY.jpg', 'frame的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'frame'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_01646bb9f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fragment-Bz2l67pGEIlhmxhLTdRUk0L0WfHPCR.jpg', 'fragment的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fragment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0abbf14cf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fountain-mMsaXpPrUwsZIUfM0ufIZqehZZNm19.jpg', 'fountain的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fountain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_3a6032eb2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/foundation-ePDlDnt6E9dWVpaNvzxv67GVX1z4SP.jpg', 'foundation的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'foundation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e2125028f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/foster-DM2bBvM1TL4JCTE9qep6eOlcY3xaB7.jpg', 'foster的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'foster'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_d9953aa57', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fossil-UIJCpz2C3L4ftSapv96eQqzso9Mnpy.jpg', 'fossil的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fossil'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_7246dd277', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forum-dVv0I2HegENxoaFmqsmacJtaCLaWI9.jpg', 'forum的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forum'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_358c0aa95', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fortunately-qvVWyZ3Bp0OnZvzJkNsoNCSiogwGmi.jpg', 'fortunately的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fortunately'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_ce5313d63', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forthcoming-qCPTKNdOCzYmlTs7EAn1hzD3SEc3pX.jpg', 'forthcoming的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forthcoming'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_670d11e28', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/formidable-5xeggkhXrJXWup5AI6aiOC00NdDvId.jpg', 'formidable的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'formidable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_16eb6cc04', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/format-yYP8jDUkJWAUYLbFfDGXw20H5xP4wm.jpg', 'format的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'format'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0c643e38c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/formal-fwz14nPLp7ucTB76j2uO3GPkkjLs51.jpg', 'formal的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'formal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_919b5ac4e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forgive-A4YJc3hBxqZhNwVqwE3cd6uE1JB7Y7.jpg', 'forgive的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forgive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_ecf46a332', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/foremost-0DSyEEpq17dZ8efd1Q8nI5FneMR6vk.jpg', 'foremost的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'foremost'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_2ce7b3ec4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forehead-XAmoLLyq0KkyimtumDx7EBCdHy2HBh.jpg', 'forehead的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forehead'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c3b5177cd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forecast-gBC3OG5rfpnSHBjagiAyOnwnWZKhnV.jpg', 'forecast的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forecast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e7e9fb19d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/forbid-YOmcbUUfyN0AxnFQWVfZJTicwXQvdu.jpg', 'forbid的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'forbid'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_4981ab84f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fond-AQPMUIpIDeObxzDDcjmaPbiXR8yFbK.jpg', 'fond的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fond'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_7b2e8e5e9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fold-mnMrphZYl6Pe7ADdG9zaJvQDoDNq1I.jpg', 'fold的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fold'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c2e779f3c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fluent-RhRMfKeWcSX6PhE2iwQQs2bSHhjZIM.jpg', 'fluent的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fluent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_b77cba006', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fluctuate-zMqTy7AT6tJf0jchoIwFqGaymUrLPt.jpg', 'fluctuate的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fluctuate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c7de873c4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flow-p8FuzX0NhH2qw8TOVxIcTQwLoHCgfA.jpg', 'flow的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flow'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_88bf99d54', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flour-IWGh1wU0COOD3ACuNQJYvxGY8ZNtjJ.jpg', 'flour的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flour'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_b1b38b8b4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/float-pjLtBbaVDqBICzI96OtDh3tWjPvfEs.jpg', 'float的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'float'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_59c30bd20', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flight-FSBg8FchxKX6RuIB97j1xAaR2hyHAx.jpg', 'flight的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flight'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_3572e742d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flexible-FKGbi7yN3r43EdtAUpv5SFubxRvNDF.jpg', 'flexible的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flexible'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_04a5144c3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flesh-dyBfRIL7P8llPQ3OCea9mS31HDvGnY.jpg', 'flesh的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flesh'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0329c7cca', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fleet-njFLPCR2ThEw8V4QUZVysO4DZgO6Nq.jpg', 'fleet的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fleet'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0233dd7ad', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flee-RPePXDUW1UaVBm1A88IYxN1k4njPNN.jpg', 'flee的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flee'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_d7097c530', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flavour-Gg1olYJPH7BsEn29dnCvKPq4lv81eN.jpg', 'flavour的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flavour'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_1b69a2a16', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flash-tUHKtt2oI90H4SXPp6bRxornTzmAtf.jpg', 'flash的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flash'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_951eb9da6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/flame-P5Y265PC1Wz7TJSWY83Wzsde01i3CY.jpg', 'flame的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'flame'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e37e914ba', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fist-qUldfNxMglgG9qng4eOPN7pl0g8sOZ.jpg', 'fist的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_47780d455', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/firm-cXldVc7bnA1rD9rVlcuXAu97tBja3Q.jpg', 'firm的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'firm'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_882bc4d4a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/finding-Fq2pqOzUWZNIXBKZL2DI8UxK9uTpgP.jpg', 'finding的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'finding'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0bf3095ef', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/financial-Iwg8czmWR6T51RG1fXkGLf82pea5tq.jpg', 'financial的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'financial'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e12be5c70', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/finance-o7CARLJNVVRzdLzSAGWLpTtnt88RA4.jpg', 'finance的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'finance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_1210bb551', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/file-KXHVBgT1yptOijzgAWiklITVxKtXd1.jpg', 'file的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'file'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_58e34587a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/figure-nC17XqEM5Wyv62ZoOfYQfeTtVlwfEM.jpg', 'figure的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'figure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_7725f3def', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fierce-efyYPp3i8hR0HfHHEtStmAJQuX67pu.jpg', 'fierce的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fierce'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_1798c7d3f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fiction-BIpRXCXn8QsHskc5bxsMoULPeboImt.jpg', 'fiction的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fiction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_dbeae7281', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fibre-xuldXacAIqmiGu6CGTG7awgSSrgTM5.jpg', 'fibre的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fibre'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_6429f9f61', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fetch-ZP1lw7IUqJoGhws8TCjAXoBa5nNoIP.jpg', 'fetch的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fetch'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_83ffb579d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fertilizer-2FiAX1mjEjKhFUmvb7sto9dBb1eLse.jpg', 'fertilizer的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fertilizer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_5ac8e32d0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ferry-xxiceS7e7Dnaid62517YDNLh6kQHKm.jpg', 'ferry的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'ferry'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_cb23686a6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fence-8aCe8JYfFDysYGwCX1DoFwRu2LcREx.jpg', 'fence的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_2b0063bd4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/female-6cTU8nEIxLtgFaOenyiVwCoVlJkrfp.jpg', 'female的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'female'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_971369a2f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fellow-qEkn6SImzobDztMMlmfzUPPRZS2Ro9.jpg', 'fellow的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fellow'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_217a76075', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/feedback-53M6YorqO72ZGR7p3qCLBQHO8jIA5N.jpg', 'feedback的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'feedback'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_a63d331a2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fee-dWlOT5rjRxrzJZ28P1Q7RGJwurVbjH.jpg', 'fee的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fee'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_592c8703c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/feature-XHa3QoTwtMQJEVdHCmRv61dQCJf8Aa.jpg', 'feature的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'feature'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_4b70b2114', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/feather-BuNAMGinSoc4Njq9zqDaJ1evoR0WSr.jpg', 'feather的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'feather'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_ae7f257e8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/feast-OiNs06fqlxzirWQBKpvbQxwj5LmGLJ.jpg', 'feast的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'feast'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_9a596445a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/feasible-s90aNSoxhgl7IOMOQvMYx8zGud0Rm8.jpg', 'feasible的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'feasible'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_639e48aec', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/favour-7kcsNS9p8ZIDgzg3zYbtrCTYRJWgWF.jpg', 'favour的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'favour'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e8d71fe81', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fault-3koTUAnoEjWXTTh7HRjpHh2rSMABXp.jpg', 'fault的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fault'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e2d1a7539', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fate-4f2zEcZRzehs6TecSaga5gQni7YkHO.jpg', 'fate的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_5b6d26dfe', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fatal-jBVbvX4BWfXmIkyx4vJm2DxAtVWdzS.jpg', 'fatal的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fatal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0071cc80c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fasten-p4lnBlTQCfpOsqTOennw3EBzMny3eq.jpg', 'fasten的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fasten'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_b029327f9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fashionable-EaIpUu3uwHPAdTwkHFzTr2uku6uvYj.jpg', 'fashionable的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fashionable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_9b101e61c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fascinating-C5IrhOSFEDZu4avIDfgEfoPS0P8DBv.jpg', 'fascinating的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fascinating'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_451ef3c01', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/farewell-y5UbBsyB10RrTdZglLCpwNkIYo4cHG.jpg', 'farewell的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'farewell'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_6ecf040e4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fare-3QOIw5vafpUUDpi8X6MmyW9I0U6jT9.jpg', 'fare的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fare'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_d259894c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fantasy-dfIG2LzzMDf1rLNGoeU1fgo4jWgSAC.jpg', 'fantasy的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fantasy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_dfcfa9382', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fancy-agP7047WR0jcrUGjliczmADsKgbPCQ.jpg', 'fancy的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fancy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_3fbcbbb16', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fame-F1uc28vQsP7iQpHWJilo1sTR0jc30n.jpg', 'fame的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fame'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_28330bf53', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fake-PwCXwYLXAuj6JziorpPMuwvFNMq2gZ.jpg', 'fake的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fake'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_1341e11b9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/faith-wFcapYOrptuGFAjrUanprKEzBYCroJ.jpg', 'faith的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'faith'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_bc67aaf49', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fairy-LEAz39D9zZLOikN61GDBnFssHPuoZE.jpg', 'fairy的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fairy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0ad1fa463', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fairly-KW42ajYbNZHWFif0oEQwVMEw8zN2gp.jpg', 'fairly的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fairly'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_6797f972e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/faint-dRJcZehaPpqgioFz5rRUpDlyuFAGOq.jpg', 'faint的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'faint'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_b4e941730', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/failure-8HRquA2Zykjs2JoqWtw0U98wh9bkJk.jpg', 'failure的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'failure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_0ba7d0757', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/fade-JeaKSmueD5sUemGMLM4T8pKtnMmwBy.jpg', 'fade的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'fade'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_a337a6687', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/factor-1Qm9oWa6jLtKFAVl1P7eyQGGjIPXsO.jpg', 'factor的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'factor'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_bde9f0082', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/facility-vaA8f92SaEdAintXpdkKm5En6YvhIH.jpg', 'facility的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'facility'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e4f2d9a5c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extremely-EhrXSdpv6MfHIsZHMQzJhTP6Tm0WHO.jpg', 'extremely的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extremely'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_bd29a518a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extreme-PEE1HWxvsb2ei1gRa1A5nYogHhngTA.jpg', 'extreme的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extreme'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_18b732b57', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extraordinary-prAXboCEhmsCeDm4R0vk3rNcSRPJpw.jpg', 'extraordinary的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extraordinary'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_3e54d5bc1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extract-BgfqvrgR0Lb3HeS04ItWNevy4adNmB.jpg', 'extract的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extract'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_c1e6e934c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extra-CPUMFvWaPp5ejNp52ELWaXBuOcNvsX.jpg', 'extra的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extra'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_5bb51293e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extinguish-i8JpCN2Tx9xbjno3GmjQORue1SABHb.jpg', 'extinguish的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extinguish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_feb093e78', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extinction-PHTuX00kBvRKxM4QKMyukSZcjUZEdC.jpg', 'extinction的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extinction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_46e9be4f9', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extinct-6vXBlbARt5yXdGPoKzoxGaX5NhxtgC.jpg', 'extinct的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extinct'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_e6af87caf', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/external-VucK6knsmtbnKMiFGeqp2yldkhlslW.jpg', 'external的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'external'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_78d33e3c5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extent-Jd7YzVG9XnXIksBvGnBQW1noz5sJky.jpg', 'extent的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_eaa24591a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extensive-hf06tSqt5WGFc1CmsYA13IpbiMNtwC.jpg', 'extensive的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extensive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_8c2869e7e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/extend-ul0egwAHUAIegRzhNyHQUT6DzBgwD7.jpg', 'extend的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'extend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_a84b8d1a5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expression-NVbIg3c7sKaJmwMhIJmYDWkhSdSBsx.jpg', 'expression的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'expression'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_04f66fa4d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exposure-FA1lnrgqGtfpY43f55iafmiGuuwvCu.jpg', 'exposure的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'exposure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_98ce75e9e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expose-hVI5r0Ek4tVe2ayQlGCo7PpVWQ9DGg.jpg', 'expose的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'expose'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_a95759ffd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/export-rh2oZtZzEfyEPm8AFKn8NW6alRTXTe.jpg', 'export的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'export'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_16aeb350c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exponential-cEdRWuhRDNa4X860s57MaOpfMGPc65.jpg', 'exponential的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'exponential'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436723_d066bc13e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/explosive-Ql3PAgP9O1CuCEyVXLpYm2HUbKocuu.jpg', 'explosive的图片', '2025-12-29 17:43:56.723'
FROM vocabularies v WHERE v.word = 'explosive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_f0e48fd18', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exploitation-ltimbjWLBvX3VLBqtK60UVva1gPBy0.jpg', 'exploitation的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exploitation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_5da5399c6', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exploit-YcsoG8zEPCClz7uM6ZY3fAh55p84zq.jpg', 'exploit的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exploit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_c76b60102', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/explode-czU5YoD2a7QOa6wS9W5NK1YkZm8NBv.jpg', 'explode的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'explode'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_de1c72eeb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expertise-mvb8awRW81yeu3RMN2e1zyRf5K86bj.jpg', 'expertise的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'expertise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_036713fe5', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expense-CWBMNVZ5cuYmhnP685fBFeKDUDbUOU.jpg', 'expense的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'expense'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_6b1794d8e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expectation-HsbhUmjlsKIyVtHU1CybLmCFmvHUEO.jpg', 'expectation的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'expectation'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d8d3cf3f4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expansion-NtR3U8euoYQF1cZbX9M4iEBwLu3sQh.jpg', 'expansion的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'expansion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_a9ccce4de', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/expand-ujNTyFg4RX7X9X4DMRwHBq4vd18GLA.jpg', 'expand的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'expand'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_7b8a5ae69', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exit-gurNUJ7NoG17iKIVetEKi4zJ0YSn5s.jpg', 'exit的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_627d80df8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/existence-hNakUqYBh9jcuHwtHIHpQJYycSO8o8.jpg', 'existence的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'existence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_370615a58', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exist-dOzYSZ14HhyJFr1FNk4UuvoUTTFFk4.jpg', 'exist的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exist'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_755df9009', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exhibition-FRPbBCAQsm7GPCoa2LQDVSQlYXXJ7z.jpg', 'exhibition的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exhibition'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_83ba999c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exhibit-xBZ1ijBCdm8LrgfwfnfSkbG4JNCHG4.jpg', 'exhibit的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exhibit'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_a0dced737', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exhaust-CbjdnKrww6K8WITt2cJndoPvJHcNdx.jpg', 'exhaust的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exhaust'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_20918370b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/executive-xeeOro1nqKAaI0MBRAgmaADtvmc8ZV.jpg', 'executive的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'executive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_6ee33f678', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/excursion-cKmus3NzpYJH41WeCMEIQYwxNL4KpS.jpg', 'excursion的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'excursion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_e276df480', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exclude-vnNwqk110LZhNQ6zVm3PYitedseL2r.jpg', 'exclude的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exclude'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_074a1bcaa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exchange-892GnDqeC85gM99Rmg5Nc0vyqU25Xb.jpg', 'exchange的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exchange'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_3fd2700c0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/excessive-lPFc7Pq5vfJR9Qoix02xT8uTVXbG81.jpg', 'excessive的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'excessive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_2c699b87c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/excess-cPv9MCHhn1rXgjD8UK7rpNskMhxO2H.jpg', 'excess的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'excess'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_b769f5657', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exceptional-296wxmZRX1h4UQ494yS6iEfg65Digu.jpg', 'exceptional的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exceptional'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_421d0371f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exceed-fn1CC5xCCmrTCFw8qKwoLr8Uw0EBZ2.jpg', 'exceed的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exceed'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_ea7e3a9fa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/examine-ER81Uq25Zo6jRjZgAms8rnb1EhKXTO.jpg', 'examine的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'examine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_01f15c1fd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/exact-aWuLwNHu5zRNYXRnE9T9t2lYUlMg41.jpg', 'exact的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'exact'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_b11291161', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evolve-JcXHfJPAvZGe5EhQXnd8o8OkxKEwo1.jpg', 'evolve的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evolve'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_08ab2d9c2', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evolution-8f0vT8V9uFjpNPaSFkZ00tjzp3fYZa.jpg', 'evolution的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evolution'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_dda4bcc7e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evil-6UVpQpbHlWjliVByG1EcfnIis7Lh2z.jpg', 'evil的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evil'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_5a858b067', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evident-RF5WiMc9XKa50IJyBM7KLwJjXZ9kXQ.jpg', 'evident的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evident'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_ae34bc5bd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evidence-Hnh89XObtcZO4MVDgAxZLQVFMZtwlt.jpg', 'evidence的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evidence'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_e1c754249', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/eventually-RrGUTLn0rtHhuBDY9HKUS8E2nqBcZc.jpg', 'eventually的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'eventually'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_7ade2239e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/evaluate-h5zCpCoQw9DuHK2K1VrfGuxieJCEAd.jpg', 'evaluate的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'evaluate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d6081d357', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ethnic-wwaO8d6oxuSHHqmgdVmKCxmORsVWMz.jpg', 'ethnic的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'ethnic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_96354fbab', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/estimate-zJNYR57jGWnuDXViWn2y3GTuMQtED6.jpg', 'estimate的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'estimate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_01e332125', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/estate-EWVp3b2f2AtSyyl638wnAy5qj43u9J.jpg', 'estate的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'estate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_efd530064', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/establish-uJqkkLnKisuTlKVu9xTFlyzQrg7T6T.jpg', 'establish的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'establish'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9dae5422c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/essential-098AehwV5to1N0oPVCvPdl6KTc61TE.jpg', 'essential的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'essential'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_2525fbc5f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/essay-YpHiBxMm3xkWrtpB7HUMmmaPLlqZue.jpg', 'essay的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'essay'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_eeeb12d85', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/escape-eHFYqenLlrHW3qp0F2sFFttk8bicDn.jpg', 'escape的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'escape'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_03355c10c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/erupt-OePtQaKkGqaZZaTzYLZCjIJ6LFuxtm.jpg', 'erupt的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'erupt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_5fc5e323a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/error-1IuPOLY1wh8JZSXx8d2PdvT2ncdg00.jpg', 'error的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'error'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_2edd9a3eb', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/erosion-uAsY2MVglbTIkSxDaXoqoLsTC0eRgd.jpg', 'erosion的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'erosion'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_6a5d78fef', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/equivalent-IlJsUbXFQgDR3pByvJCY3d6xsHycB0.jpg', 'equivalent的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'equivalent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_e04111db7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/equipment-StHtZUE9CUgpEMfZcL9ImUsYh71XsT.jpg', 'equipment的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'equipment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_7c0b3b421', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/equip-VpMzXkXUe0Xdz51qPYIxwnUFuVHnAE.jpg', 'equip的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'equip'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_353c13b9d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/equator-feWXMhvCY5ZHzbrm3i1ShB52jwnNXH.jpg', 'equator的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'equator'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d5a4fbf51', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/equal-Fzav9s9h25GvaoClTepOtp3589a85F.jpg', 'equal的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'equal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_1bef33f24', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/episode-aIfwxn9MzfdNpE5WxhZpezpZKgUAp5.jpg', 'episode的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'episode'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_b10d8c1e3', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/envy-CmoW2ihWI6GUiQfxClbhaJW7dDqsbn.jpg', 'envy的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'envy'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9c69b7226', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/envelope-NvxGUg5T1iFQkhbNZBn3TknLpIFhYE.jpg', 'envelope的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'envelope'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_464438662', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entry-jePQyGjKAQwZhBUzXXMbLM9RexDBfE.jpg', 'entry的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entry'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_8e612a635', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entrepreneur-ViDWjQLXUrYW5HeLdhPUSIAcb9XxEd.jpg', 'entrepreneur的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entrepreneur'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9de973124', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entrance-GqSoyxqTcqjPOlPAeamnXDL46sIllf.jpg', 'entrance的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entrance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_6a77fcfaa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entitlement-WIDl0BxzBIuR9TxP7FCfozDvdbffLN.jpg', 'entitlement的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entitlement'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_61f9b85c1', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entitle-FY35x1VZtEhfO9rNfSkmcDCDHBiGUd.jpg', 'entitle的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entitle'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9b8e5cc41', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enthusiastic-Cd630nShWbKaVIAcNXAE87GHHGicKW.jpg', 'enthusiastic的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enthusiastic'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_99810d4a7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entertainment-BQ9jnQNBy0f4y6dxHIR0kb3d4dhiq3.jpg', 'entertainment的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entertainment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_35c35787d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/entertain-ZBbrl1QAXZ1qVHKxz1IM4npJoqznjX.jpg', 'entertain的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'entertain'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_b00ef939f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enterprise-4R228fPiMBRIIObwXBKSUjf63KQMPP.jpg', 'enterprise的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enterprise'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_ffd9c5b7c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/ensure-PlL5pSJT7vRJx28Q0scUI7Kxu4cuhb.jpg', 'ensure的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'ensure'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9d451a8e7', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enrolment-leoQJKR6ZhNyHPGLIjKtqS8nzfLsu3.jpg', 'enrolment的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enrolment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_9a440cfd0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enrich-RoXtCGzJ50rQxwQy0sjpBNeuIvbzwP.jpg', 'enrich的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enrich'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_91c24a41c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enormous-BSPy2VFXsjybQF7aVk4rGJjOIubHm7.jpg', 'enormous的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enormous'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_81e36af64', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enhance-eNEGw735DkVuehl85Nn7PJ8KeqNJWL.jpg', 'enhance的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enhance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_dcb704535', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/engineering-QBOSo9o2QOG9X1YmWTAUhZVYFV5MN3.jpg', 'engineering的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'engineering'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_e37ff8236', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/engine-lDyhkdPLpzo7i2NW6DMFeqhF02yLLT.jpg', 'engine的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'engine'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_2b5b9440c', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/engage-EoGSuv8xdcApQASksxMEcrjoIfgehW.jpg', 'engage的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'engage'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_3c671ff66', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/endurance-PRPUpVHJZ5CrFXzLAPGroAQmbqgUuN.jpg', 'endurance的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'endurance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_79d53a4cc', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/endeavor-xpVSAHgTIoNyDkMIgUJW9DBOGTZs2Z.jpg', 'endeavor的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'endeavor'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_c7f2c7133', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/encouragement-WR6Zag23LKtOVza7o3g1gUlR0vXLXo.jpg', 'encouragement的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'encouragement'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d95fecc02', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/encounter-Ip1jzCjclLmXStCFJhHeUNntPSMuPr.jpg', 'encounter的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'encounter'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_502f1bc8e', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enclose-IOe7QQiWjnxb8YfuXFI0GWaY8DxvIg.jpg', 'enclose的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enclose'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_8ba820666', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/enable-mKeUhbeqbOI9Z0gDBGxXGJjxfvNk4m.jpg', 'enable的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'enable'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d11a76780', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/empower-UKPQePJJ1uT9XrawK3wDGilKV8sxmG.jpg', 'empower的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'empower'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_8992d20a8', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/employment-u2FivTVFAEdxbprRwiVkA7rEMafX2w.jpg', 'employment的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'employment'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_46a891138', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/employer-HtR6JbneNVnRVPlRvKcyq9NLEurILE.jpg', 'employer的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'employer'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_d7277af48', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/employee-x9HtaoPbzDBjofLiwJW4rSTFHRHBwW.jpg', 'employee的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'employee'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_0b36718a4', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/employ-MZlrP0aDdBskSNTPqoxDPxqfdLi55O.jpg', 'employ的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'employ'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_e308c0952', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/empire-UqKrXYYp8gdbulKnlH0Rkrr22yNHhe.jpg', 'empire的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'empire'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_cb3f208bd', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/emphasize-lSsXYMLMYIH2ZdMCF0otCGawtopX77.jpg', 'emphasize的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'emphasize'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_b56d006f0', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intrigue-S4yJv0TTM6jYVs8kD7PDXTVb6dTQNC.jpg', 'intrigue的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intrigue'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_ab991236d', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intimidate-PPJ9RpfuG3NrNGXBsEkLM0SfNMWvyC.jpg', 'intimidate的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intimidate'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_daa59bf59', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intervention-WY5ll9waz7B87kTBTcfxZcAbpf5p2X.jpg', 'intervention的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intervention'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_57aa86eaa', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/interval-v5YZeSJyHCi2wshjlzrTiXHGr34iXD.jpg', 'interval的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'interval'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_4c261c2ee', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/interrupt-kXsPQOr3fPrEH89t8EapuQpwOvH0TO.jpg', 'interrupt的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'interrupt'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_4230df780', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/interpret-XfrR0hcWZp5odaZlIc43GZZD0Le1G0.jpg', 'interpret的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'interpret'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_39251843b', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/internship-PiuFwAxIVcVlhJ2C6T3D0sG7gZ9P7m.jpg', 'internship的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'internship'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_620c6a566', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/internal-46mLiP2HTuJyqpfBCIx3i7GD9NqSO0.jpg', 'internal的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'internal'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_4a94faa0a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/interaction-oUEA6sfHgZUHlL7lAwgm00WYmC5hZB.jpg', 'interaction的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'interaction'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_157a66d61', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/interact-a9UrgUUHUY54pj46Fe6b2vYCqfFJpF.jpg', 'interact的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'interact'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_141bdc453', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intention-TAGiliY8mPcY25XdbiI7DlGBlh7RD1.jpg', 'intention的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intention'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_970f596ff', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intensive-QzsbRFG1nVLLSYe40BhAIS0b4VKjPO.jpg', 'intensive的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intensive'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_36814b436', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intense-bBw2GrYgEAKem4fojnmOGmBCAF4sXH.jpg', 'intense的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intense'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_666bfd13f', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intend-Ge0hXl23fXucxEz0GYAdYm51Vi7Kg1.jpg', 'intend的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intend'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_bff3bb9ff', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intelligent-ZwcD7cbbgF0dOvAf81EW91TEHeyb00.jpg', 'intelligent的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intelligent'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_19d0c8926', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intellectual-kADT0bEKKI3U5Ksl1CbdsMxKugdt1i.jpg', 'intellectual的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intellectual'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_8c30663da', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/integration-RgVv09TLwIEVrB80OL3ZQ1Xtcnb4hu.jpg', 'integration的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'integration'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_711087f70', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/intake-frvm8By9cvJeiUIwAbsKbiltXLtwiO.jpg', 'intake的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'intake'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

INSERT INTO word_images (id, "vocabularyId", "imageUrl", description, "createdAt")
SELECT 'image_1767001436724_7e15de74a', v.id, 'https://aul5hsnqwn21br8h.public.blob.vercel-storage.com/vocabulary-images/insurance-qIJ67q4sFYYxKPMSuwgLXvRBCOmpeR.jpg', 'insurance的图片', '2025-12-29 17:43:56.724'
FROM vocabularies v WHERE v.word = 'insurance'
AND NOT EXISTS (SELECT 1 FROM word_images wi WHERE wi."vocabularyId" = v.id);

COMMIT;
