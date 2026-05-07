# beaute beta test guide

## Share links

- App: https://beaute-xi.vercel.app
- Feedback form: https://beaute-xi.vercel.app/feedback
- Admin feedback inbox: https://beaute-xi.vercel.app/admin/feedback

## Message to send

```text
beauteのテスト版を触って、1分くらいの感想アンケートに答えてもらえると嬉しいです。

見てほしいところ：
・スマホで触りやすいか
・何をすればいいか分かるか
・楽天の商品検索/ランキングが便利そうか
・カルテやPROに月500円の価値を感じるか
・友達やSNSで広まりそうか

アプリ：
https://beaute-xi.vercel.app

感想フォーム：
https://beaute-xi.vercel.app/feedback
```

## What the form measures

- Overall satisfaction
- Clarity of the first experience
- Recommendation quality
- Design impression
- Paid value at 500 JPY/month
- Features that felt valuable
- Confusing areas
- Missing features
- Mobile friction
- Referral/spread ideas
- Permission to use anonymous quotes

## Operational note

The feedback API first tries to save to `beta_feedback`.
If that Supabase table is not applied yet, it temporarily saves to `api_usage_events` with `operation = beta_feedback`.

To switch to the formal table, run `supabase/schema.sql` in the Supabase SQL Editor.
