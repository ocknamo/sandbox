package server

import "github.com/ocknamo/sandbox/jev-bitcoin/internal/router"

// What the service says when it has no answer to give. Like the answers, these
// are prepared in advance; the model only picks which one fits.
//
// A miss is not an error. The reader asked something real that the corpus
// does not cover yet, and the most useful thing to say is exactly that.
var (
	msgSuggest = []string{"ぴったりの答えは見つかりませんでしたが、近い質問があります。"}

	msgMultiple = []string{
		"一度にいくつかのことを聞かれているようです。答えは質問ひとつにつきひとつなので、ひとつずつ質問してください。",
	}

	msgMultipleNear = []string{
		"一度にいくつかのことを聞かれているようです。答えは質問ひとつにつきひとつなので、ひとつずつ質問してください。",
		"近い質問から選ぶこともできます。",
	}

	msgMiss = []string{
		"その質問への答えはまだ用意していません。",
		"このサービスは、あらかじめ用意した答えだけを返します。その場で答えを作ることはしません。",
		"質問は記録され、今後の答えを増やす参考にします。言い方を変えると見つかることもあります。",
	}

	msgAdvice = []string{
		"売買の判断や価格の予想にはお答えしていません。",
		"ここで答えるのはビットコインの仕組みについての質問です。たとえば「なぜ価値があるのか」「発行上限はいくつか」といった問いなら答えられます。",
	}

	msgGreeting = []string{
		"こんにちは。ビットコインについて知りたいことを、文章でそのまま書いてください。",
		"たとえば「秘密鍵をなくしたらどうなる？」「ライトニングって何？」のように聞けます。",
	}

	msgOffTopic = []string{
		"ビットコイン以外の話題にはお答えしていません。",
		"ビットコインと比べたい、という質問であれば、その形で聞いてみてください。",
	}

	msgNonsense = []string{"質問を読み取れませんでした。ビットコインについて知りたいことを文章で書いてください。"}
)

// message picks the words for a routing that ended without an answer.
func message(res *router.Result, suggesting bool) []string {
	if res.Status == router.Multiple {
		if suggesting {
			return msgMultipleNear
		}
		return msgMultiple
	}
	if suggesting {
		return msgSuggest
	}
	switch res.Kind {
	case router.KindAdvice:
		return msgAdvice
	case router.KindGreeting:
		return msgGreeting
	case router.KindOffTopic:
		return msgOffTopic
	case router.KindNonsense:
		return msgNonsense
	}
	return msgMiss
}
