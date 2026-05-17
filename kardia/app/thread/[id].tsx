import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useCommunity, type Comment } from '@/context/CommunityContext';
import { Colors, Fonts } from '@/constants/theme';

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, isLast }: { comment: Comment; isLast: boolean }) {
  return (
    <>
      <View style={styles.commentRow}>
        {comment.authorImage ? (
          <Image source={{ uri: comment.authorImage }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.author[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentBody}>
          <View style={styles.commentMeta}>
            <Text style={styles.commentAuthor}>{comment.author}</Text>
            <Text style={styles.commentTime}>{comment.timestamp}</Text>
          </View>
          <Text style={styles.commentText}>{comment.body}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.commentDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useUser();
  const { posts, toggleUpvote, addComment } = useCommunity();
  const listRef = useRef<FlatList>(null);

  const [replyText, setReplyText] = useState('');

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Post not found.</Text>
      </SafeAreaView>
    );
  }

  function handleSend() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    addComment(post!.id, user?.firstName || 'You', trimmed, user?.imageUrl);
    setReplyText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  const ListHeader = (
    <View>
      {/* ── Back button ── */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <FontAwesome name="chevron-left" size={13} color={Colors.wine} />
        <Text style={styles.backText}>Community</Text>
      </TouchableOpacity>

      {/* ── Original post ── */}
      <View style={styles.postCard}>
        <View style={styles.postMeta}>
          <View style={styles.authorChip}>
            {post.authorImage && (
              <Image source={{ uri: post.authorImage }} style={styles.postAuthorAvatar} />
            )}
            <Text style={styles.authorChipText}>{post.authorName}</Text>
          </View>
          <View style={[styles.categoryPill, { backgroundColor: Colors.blush }]}>
            <Text style={[styles.categoryPillText, { color: Colors.burgundy }]}>{post.category}</Text>
          </View>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postBody}>{post.body}</Text>

        {/* Upvote row */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.upvoteBtn}
            onPress={() => toggleUpvote(post.id)}
            activeOpacity={0.75}
          >
            <FontAwesome
              name="arrow-up"
              size={13}
              color={post.upvoted ? Colors.cream : Colors.wine}
            />
            <Text style={[styles.upvoteCount, post.upvoted && styles.upvoteCountActive]}>
              {post.upvoteCount}
            </Text>
          </TouchableOpacity>
          <View style={styles.replyCountChip}>
            <FontAwesome name="comment-o" size={12} color={Colors.wine} />
            <Text style={styles.replyCountText}>
              {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Thread label ── */}
      <Text style={styles.threadLabel}>Thread</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <FlatList
          ref={listRef}
          style={styles.scroll}
          contentContainerStyle={styles.container}
          data={post.comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <CommentRow
              comment={item}
              isLast={index === post.comments.length - 1}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <FontAwesome name="comment-o" size={28} color={Colors.blush} />
              <Text style={styles.emptyText}>No replies yet. Be the first to respond.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 16 }} />}
          showsVerticalScrollIndicator={false}
        />

        {/* ── Reply input ── */}
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Add a reply…"
            placeholderTextColor={Colors.borderCard}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!replyText.trim()}
            activeOpacity={0.8}
          >
            <FontAwesome name="send" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.cream },
  flex:  { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 8 },

  notFound: {
    textAlign: 'center',
    marginTop: 60,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textMuted,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.wine,
  },

  // ── Original post card ──
  postCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 18,
    marginBottom: 24,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  authorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blush,
    borderRadius: 20,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
  },
  postAuthorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  authorChipText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.burgundy,
    marginLeft: 2,
  },
  categoryPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },

  postTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: Colors.textDark,
    lineHeight: 25,
    marginBottom: 10,
  },
  postBody: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderCard,
    paddingTop: 14,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blush,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upvoteCount: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.wine,
  },
  upvoteCountActive: { color: Colors.burgundy },

  replyCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyCountText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.wine,
  },

  // ── Thread label ──
  threadLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 14,
  },

  // ── Comment rows ──
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.wine,
  },
  commentBody: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 5,
  },
  commentAuthor: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textDark,
  },
  commentTime: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  commentText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 21,
  },
  commentDivider: { height: 1, backgroundColor: Colors.borderCard, marginLeft: 46 },

  // ── Empty state ──
  emptyComments: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Reply bar ──
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderTopColor: Colors.borderCard,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.wine,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.wine,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.blush, shadowOpacity: 0 },
});
