# GraphQL — Deep Dive

> 📅 2026-02-14 · ⏱ 15 phút đọc
>
> GraphQL vs REST, SDL (Schema Definition Language), Type System,
> Query & Mutation, Scalar, Enum, Interface, Fragment,
> Code First (NestJS), Apollo Client, Introspection, Security
> Độ khó: ⭐️⭐️⭐️⭐️ | Full-stack Interview

---

## Mục Lục

| #   | Phần                                          |
| --- | --------------------------------------------- |
| 1   | GraphQL là gì? Tại sao dùng?                  |
| 2   | GraphQL vs RESTful — So sánh chi tiết         |
| 3   | SDL — Schema Definition Language              |
| 4   | Type System — Object, Scalar, Enum, Interface |
| 5   | Query & Mutation — 2 Operations cốt lõi       |
| 6   | Code First — NestJS + TypeScript Decorators   |
| 7   | Frontend — Apollo Client, Fragment, Hooks     |
| 8   | Introspection — Tự khám phá Schema            |
| 9   | Security — Bảo mật GraphQL Production         |
| 10  | Tổng kết & Checklist phỏng vấn                |

---

## §1. GraphQL là gì? Tại sao dùng?

```
GRAPHQL — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  GraphQL = QUERY LANGUAGE cho APIs!
  → KHÔNG phải database query language (như SQL)!
  → Là ngôn ngữ truy vấn cho API layer!

  LỊCH SỬ:
  → 2012: Facebook phát triển nội bộ!
  → 2015: Facebook open-source GraphQL!
  → 2018: Facebook chuyển GraphQL cho GraphQL Foundation!
  → Hiện tại: Facebook, Twitter, Netflix, PayPal, GitHub đều dùng!
  → GitHub API v4: 100% GraphQL!

  2 NGUYÊN LÝ CỐT LÕI:

  ① TRẢ VỀ DỮ LIỆU CHÍNH XÁC & DỰ ĐOÁN ĐƯỢC:
  ┌────────────────────────────────────────────────────────┐
  │ REST:                                                  │
  │ → Backend trả VỀ BAO NHIÊU fields → frontend NHẬN HẾT!│
  │ → Frontend chỉ cần 3 fields nhưng nhận 30! 😩          │
  │ → Over-fetching! Tốn bandwidth + processing!           │
  │                                                        │
  │ GraphQL:                                                │
  │ → Client CHỌN CHÍNH XÁC fields cần!                    │
  │ → Không thừa, không thiếu!                              │
  │ → Field filtering chạy TỰ ĐỘNG, độc lập server!        │
  └────────────────────────────────────────────────────────┘

  ② CHỈ 1 ENDPOINT, 1 REQUEST:
  ┌────────────────────────────────────────────────────────┐
  │ REST:                                                  │
  │ GET    /posts         → Lấy danh sách                   │
  │ GET    /post/:id      → Lấy chi tiết                    │
  │ POST   /post          → Tạo mới                         │
  │ PUT    /post/:id      → Cập nhật                        │
  │ DELETE /post/:id      → Xóa                             │
  │ → 5 endpoints! NHIỀU TCP connections!                   │
  │                                                        │
  │ GraphQL:                                                │
  │ POST /graphql         → MỌI THỨ qua 1 endpoint!        │
  │ → Request body chứa query/mutation!                     │
  │ → 1 endpoint GIẢI QUYẾT TẤT CẢ!                       │
  └────────────────────────────────────────────────────────┘
```

---

## §2. GraphQL vs RESTful — So sánh chi tiết

```
GRAPHQL vs REST — BẢNG SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí        │ RESTful          │ GraphQL               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Endpoints       │ NHIỀU endpoints  │ 1 endpoint duy nhất!  │
  │                 │ /users, /posts   │ /graphql               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Data fetching   │ Fixed response   │ Client CHỌN fields!   │
  │                 │ (over/under      │ Chính xác!             │
  │                 │  fetching!)      │                        │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Versioning      │ /api/v1, /api/v2 │ KHÔNG CẦN version!    │
  │                 │ Tạo version mới! │ Thêm fields mới!      │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ HTTP Methods    │ GET/POST/PUT/    │ Chủ yếu POST!         │
  │                 │ PATCH/DELETE     │ Query + Mutation!      │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Type System     │ Không built-in   │ BUILT-IN! Schema!     │
  │                 │ (cần Swagger/    │ SDL + Type checking!   │
  │                 │  OpenAPI)        │                        │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Caching         │ Dễ! HTTP cache!  │ Khó hơn! (POST!)      │
  │                 │ GET + ETags!     │ Cần Apollo Cache!      │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Learning curve  │ Đơn giản!        │ Phức tạp hơn!         │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Real-time       │ WebSocket/SSE    │ Subscription built-in!│
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ File upload     │ Dễ! Multipart!   │ Khó! Cần graphql-     │
  │                 │                  │ upload package!        │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Error handling  │ HTTP status codes│ Luôn 200! Errors      │
  │                 │ 4xx, 5xx         │ trong response body!   │
  └─────────────────┴──────────────────┴──────────────────────┘

  KHI NÀO DÙNG GÌ?
  → REST: API đơn giản, caching quan trọng, file upload nhiều!
  → GraphQL: Dữ liệu phức tạp, nhiều clients (web/mobile/desktop),
             cần flexibility, real-time subscriptions!
```

---

## §3. SDL — Schema Definition Language

```
SDL — NGÔN NGỮ ĐỊNH NGHĨA SCHEMA:
═══════════════════════════════════════════════════════════════

  GraphQL KHÔNG PHỤ THUỘC ngôn ngữ lập trình nào!
  → Có CÚ PHÁP RIÊNG: SDL (Schema Definition Language)!
  → Dùng để mô tả types, queries, mutations!
```

```graphql
# ═══ OBJECT TYPE — Kiểu đối tượng ═══

type Language {
  code: String! # String, KHÔNG rỗng (!)
  name: String!
  native: String!
}

type Location {
  geoname_id: Float!
  capital: String!
  languages: [Language!]! # Mảng Language, mảng KHÔNG rỗng, phần tử KHÔNG rỗng!
  country_flag: String!
  country_flag_emoji: String!
  calling_code: String!
  is_eu: Boolean!
  created_at: DateTime! # Custom scalar (xem bên dưới!)
}

# GIẢI THÍCH:
# → "type Language" = GraphQL Object Type!
# → Dùng để định nghĩa response từ backend!
# → code, name, native = FIELDS của Language!
# → Query Language → CHỈ được query 3 fields này! Query field khác → LỖI!
# → "!" = NON-NULL! Backend trả null → LỖI!
# → "[Language!]!" = Mảng Language:
#   → Mảng KHÔNG được null!
#   → Mỗi phần tử KHÔNG được null!
```

```graphql
# ═══ INPUT TYPE — Kiểu tham số đầu vào ═══

input CreatePostInput {
  posterUrl: String!
  title: String!
  summary: String!
  content: String!
  tags: [String!]! # Mảng strings, cả mảng và phần tử đều non-null!
  lastModifiedDate: String!
  isPublic: Boolean # KHÔNG có "!" → nullable! (optional!)
}

# → "input" = Input Type! Dùng cho THAM SỐ truyền vào query/mutation!
# → Khác "type": type dùng cho response, input dùng cho parameters!
```

---

## §4. Type System — Scalar, Enum, Interface

```
5 SCALAR MẶC ĐỊNH:
═══════════════════════════════════════════════════════════════

  Scalar = kiểu dữ liệu CƠ BẢN (leaf values!)

  ┌─────────┬────────────────────────────────────┐
  │ Scalar  │ Ý nghĩa                            │
  ├─────────┼────────────────────────────────────┤
  │ Int     │ Số nguyên 32-bit có dấu            │
  │ Float   │ Số thực dấu phẩy động              │
  │ String  │ Chuỗi ký tự UTF-8                  │
  │ Boolean │ true / false                        │
  │ ID      │ Identifier duy nhất (serialize = String) │
  └─────────┴────────────────────────────────────┘

  CẦN MỞ RỘNG? → Custom Scalar!
  → Mỗi scalar cần implement 3 methods:
    ① parseValue: client → server (từ variable values!)
    ② serialize: server → client (trả về cho frontend!)
    ③ parseLiteral: parse từ AST (inline literal values!)
```

```typescript
// ═══ CUSTOM SCALAR — VÍ DỤ: DateScalar ═══

import { Scalar, CustomScalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("Date")
export class DateScalar implements CustomScalar<number, Date> {
  description = "Date custom scalar type";

  // Client gửi number → Server nhận Date object:
  parseValue(value: number): Date {
    return new Date(value);
  }

  // Server trả về cho client dưới dạng number:
  serialize(value: Date): number {
    return value.getTime();
  }

  // Parse từ AST (query inline):
  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}

// ⚠️ Viết custom scalar khá phiền!
// → Dùng graphql-scalars library:
// → ~50 scalars sẵn có:
//   PositiveInt, NegativeInt, DateTime, Date,
//   EmailAddress, HexColorCode, URL, JSON, ...
```

```graphql
# ═══ ENUM — Kiểu liệt kê ═══

enum PostStatus {
  DRAFT # Bản nháp
  PUBLISH # Đã xuất bản
}

# → Enum = Scalar ĐẶC BIỆT!
# → Giới hạn trong TẬP GIÁ TRỊ CỐ ĐỊNH!
# → Truyền giá trị ngoài tập → LỖI!
# → Hệ thống type biết field luôn nằm trong tập giá trị hữu hạn!
```

```graphql
# ═══ INTERFACE — Kiểu trừu tượng ═══

interface Common {
  status_msg: String!
  status_code: Int!
}

type User implements Common {
  id: ID!
  name: String!
  email: String!
  status_msg: String! # BẮT BUỘC phải có! (từ interface!)
  status_code: Int! # BẮT BUỘC phải có!
}

# → Interface = abstract type!
# → Chứa FIELDS BẮT BUỘC!
# → Object type "implements" interface → PHẢI có các fields đó!
# → Giống interface trong TypeScript/Java!
```

---

## §5. Query & Mutation — 2 Operations cốt lõi

```graphql
# ═══ 2 SPECIAL TYPES: Query & Mutation ═══

# QUERY = Đọc dữ liệu (tương đương GET trong REST!)
type Query {
  getPosts(input: PaginationInput!): PostModel!
  getPostById(id: ID!): PostItemModel!
}

# MUTATION = Thay đổi dữ liệu (tương đương POST/PUT/DELETE!)
type Mutation {
  createPost(input: CreatePostInput!): PostItemModel!
  updatePost(id: ID!, input: UpdatePostInput!): PostItemModel!
  deletePost(id: ID!): Boolean!
}

# GIẢI THÍCH:
# → getPosts: tên query (tương đương path trong REST!)
# → input: PaginationInput! → tham số BẮT BUỘC!
# → PostModel! → return type NON-NULL!
#
# ⚠️ Dù Query CÓ THỂ thực hiện CRUD...
# → Khuyến khích: Query = đọc, Mutation = ghi!
# → Rõ ràng semantic!
```

```javascript
// ═══ CLIENT GỬI QUERY ═══

// REST: GET /posts?page=1&pageSize=10
// GraphQL:
const requestBody = {
  operationName: "Posts",
  query: `
        query Posts($input: PaginationInput!) {
            posts(input: $input) {
                total
                page
                pageSize
                items {
                    _id
                    title
                    summary
                }
            }
        }
    `,
  variables: {
    input: {
      page: 1,
      pageSize: 10,
    },
  },
};

// → Gửi POST đến /graphql
// → operationName: tên operation (optional, cho debugging!)
// → query: GraphQL query string!
// → variables: biến truyền vào query!
//
// ⚠️ Client CHỌN CHÍNH XÁC fields cần:
// → Chỉ lấy: _id, title, summary!
// → KHÔNG lấy: content, tags, posterUrl, createdAt, ...!
// → Server TỰ ĐỘNG filter! Không cần backend thay đổi gì!
```

```
QUERY vs MUTATION vs SUBSCRIPTION:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────┬─────────────────────────────┐
  │ Operation    │ REST       │ Ý nghĩa                     │
  ├──────────────┼────────────┼─────────────────────────────┤
  │ Query        │ GET        │ ĐỌC dữ liệu!               │
  ├──────────────┼────────────┼─────────────────────────────┤
  │ Mutation     │ POST/PUT/  │ GHI/CẬP NHẬT/XÓA dữ liệu! │
  │              │ DELETE     │                             │
  ├──────────────┼────────────┼─────────────────────────────┤
  │ Subscription │ WebSocket/ │ REAL-TIME push từ server!   │
  │              │ SSE        │ Built-in trong GraphQL!     │
  └──────────────┴────────────┴─────────────────────────────┘
```

---

## §6. Code First — NestJS + TypeScript Decorators

```typescript
// ═══ CODE FIRST vs SCHEMA FIRST ═══

// SCHEMA FIRST: viết SDL thuần (File .graphql) → generate code!
// CODE FIRST: viết TypeScript decorators → TỰ ĐỘNG generate SDL!

// → Code First phổ biến hơn trong NestJS!
// → GraphQL schema TỰ ĐỘNG sinh ra từ decorators!
```

```typescript
// ═══ INPUT TYPE — Code First ═══

import { InputType, Field } from "@nestjs/graphql";
import {
  IsString,
  IsUrl,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
} from "class-validator";

@InputType()
export class CreatePostInput {
  @Field({ nullable: false })
  @IsString()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @IsNotEmpty()
  public readonly posterUrl: string;
  // → @Field: khai báo GraphQL field!
  // → @IsUrl: class-validator! Kiểm tra URL hợp lệ!
  // → Ràng buộc CHẶT hơn SDL thuần!

  @Field({ nullable: false })
  @IsString()
  @MinLength(1)
  @MaxLength(20) // Giới hạn 1-20 ký tự!
  @IsNotEmpty()
  public readonly title: string;

  @Field({ nullable: false })
  @IsString()
  @IsNotEmpty()
  public readonly summary: string;

  @Field({ nullable: false })
  @IsString()
  @IsNotEmpty()
  public readonly content: string;

  @Field(() => [String], { nullable: false })
  @IsArray()
  @IsString({ each: true }) // Mỗi phần tử phải là string!
  @ArrayNotEmpty() // Mảng không rỗng!
  @ArrayUnique() // Không trùng lặp!
  @IsNotEmpty()
  public readonly tags: string[];

  @Field({ nullable: false })
  @IsString()
  @IsNotEmpty()
  public readonly lastModifiedDate: string;

  @Field({ nullable: true }) // Optional!
  public readonly isPublic?: boolean;
}

// ⚠️ ƯU ĐIỂM CODE FIRST:
// → Kết hợp class-validator → ràng buộc CHẶT HƠN SDL!
// → posterUrl PHẢI là HTTPS URL!
// → title PHẢI 1-20 ký tự!
// → tags PHẢI unique + non-empty!
// → SDL thuần KHÔNG LÀM ĐƯỢC những điều này!
```

```typescript
// ═══ RESOLVER — Query & Mutation handler ═══

import { Resolver, Query, Mutation, Args, ID } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";

@Resolver()
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => PostItemModel)
  // ↑ Khai báo: đây là QUERY! Return type = PostItemModel!
  public async getPostById(
    @Args({ name: "id", type: () => ID }) id: string,
    // ↑ Tham số: "id" có scalar type = ID!
  ) {
    return this.postsService.findOneById(id); // → SQL/MongoDB!
  }

  @Mutation(() => PostItemModel)
  // ↑ Khai báo: đây là MUTATION! Return type = PostItemModel!
  @UseGuards(GqlAuthGuard)
  // ↑ Cần authentication! (Auth Guard!)
  public async createPost(
    @Args("input") input: CreatePostInput,
    // ↑ Tham số: "input" có type = CreatePostInput!
  ) {
    return this.postsService.create(input);
  }
}

// GIẢI THÍCH:
// → @Resolver() = class xử lý GraphQL requests!
// → @Query(() => ReturnType) = định nghĩa query!
// → @Mutation(() => ReturnType) = định nghĩa mutation!
// → @Args() = khai báo parameters!
// → Method name = tên query/mutation trong schema!
// → @UseGuards() = middleware bảo vệ (authentication!)
```

```typescript
// ═══ OBJECT TYPE (Response) — Code First ═══

import { ObjectType, Field } from "@nestjs/graphql";
import {
  IsMobilePhone,
  IsNotEmpty,
  IsNumberString,
  Length,
} from "class-validator";

@ObjectType()
export class SMSModel {
  @Field()
  @IsMobilePhone("zh-CN") // Validate số điện thoại TQ!
  @IsNotEmpty()
  public readonly phoneNumber: string;

  @Field()
  @Length(6) // Đúng 6 ký tự!
  @IsNumberString() // Phải là chuỗi số!
  @IsNotEmpty()
  public readonly smsCode: string;
}

// → @ObjectType() cho response types!
// → @InputType() cho input/parameter types!
// → Cả hai đều hỗ trợ class-validator decorators!
```

---

## §7. Frontend — Apollo Client, Fragment, Hooks

```
FRONTEND GRAPHQL — ECOSYSTEM:
═══════════════════════════════════════════════════════════════

  Bản chất: Frontend gửi POST request đến /graphql!
  → Request body = { operationName, query, variables }!
  → Có thể dùng fetch/axios thuần!

  NHƯNG: để tích hợp TỐT HƠN → dùng LIBRARY:

  ┌────────────────────────────────────────────────────────┐
  │ ① Relay (Facebook)                                     │
  │ → Facebook tự phát triển!                               │
  │ → relay-modern = phiên bản mới nhất!                    │
  │ → Dùng trên facebook.com!                               │
  │ → NHƯNG: phục vụ nội bộ FB → khó dùng cho bên ngoài!   │
  ├────────────────────────────────────────────────────────┤
  │ ② Apollo Client (PHỔ BIẾN NHẤT!) ⭐                     │
  │ → Hỗ trợ: React (Hooks!), Vue, Angular, iOS, Android! │
  │ → Apollo Server cho backend Node.js!                    │
  │ → Caching, DevTools, Code Generation!                   │
  │ → CHỌN NÀY cho hầu hết projects!                      │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══ FRAGMENT — TÁI SỬ DỤNG FIELDS ═══

import { gql } from "@apollo/client";

// Fragment = TẬP HỢP FIELDS có thể TÁI SỬ DỤNG!
const POST_FRAGMENT = gql`
  fragment PostFragment on PostItemModel {
    _id
    posterUrl
    title
    summary
    content
    tags
    lastModifiedDate
    like
    pv
    isPublic
    createdAt
    updatedAt
  }
`;

// QUERY dùng fragment:
export const GET_POST = gql`
  query GetPost($id: ID!) {
    getPostById(id: $id) {
      ...PostFragment
    }
  }
  ${POST_FRAGMENT}
`;

// MUTATION dùng CÙNG fragment:
export const CREATE_ONE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFragment
    }
  }
  ${POST_FRAGMENT}
`;

// ⚠️ TẠI SAO DÙNG FRAGMENT?
// → Query và Mutation trả về CÙNG KIỂU PostItemModel!
// → Không cần viết LẶP LẠI danh sách fields!
// → Thay đổi 1 chỗ → ÁP DỤNG TOÀN BỘ!
// → DRY principle!
```

```tsx
// ═══ REACT HOOKS — useMutation ═══

import { useMutation } from "@apollo/client";

const [createPost, { loading }] = useMutation<
  CreatePostMutation, // Response type!
  CreatePostVars // Variables type!
>(CREATE_ONE_POST, {
  onCompleted(data) {
    const newPost = data.createPost;
    enqueueSnackbar("Create success!", { variant: "success" });
  },
  onError(error) {
    console.error("GraphQL error:", error);
  },
});

// GIẢI THÍCH:
// → useMutation<Response, Variables>(MUTATION_DOC, options)!
// → Return: [executeFn, { loading, data, error }]!
// → createPost() = gọi mutation!
// → loading = boolean → show loading spinner!
// → onCompleted = callback khi thành công!
// → onError = callback khi lỗi!

// ═══ useQuery ═══
import { useQuery } from "@apollo/client";

const { data, loading, error, refetch } = useQuery<PostsQuery, PostsVars>(
  GET_POSTS,
  {
    variables: { input: { page: 1, pageSize: 10 } },
  },
);

// → useQuery TỰ ĐỘNG gọi khi component mount!
// → refetch() = gọi lại query!
// → data = response từ server!
// → loading/error = trạng thái!
```

---

## §8. Introspection — Tự khám phá Schema

```graphql
# ═══ INTROSPECTION — KHÁM PHÁ SCHEMA TỰ ĐỘNG ═══

# GraphQL hỗ trợ hệ thống INTROSPECTION mạnh mẽ!
# → Tra cứu TOÀN BỘ schema đã thiết kế trên backend!
# → Dùng để: xây dựng IDE, documentation, code generation!

# VÍ DỤ: Tra cứu type PostItemModel:
{
  __type(name: "PostItemModel") {
    name
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}

# KẾT QUẢ:
# {
#   "data": {
#     "__type": {
#       "name": "PostItemModel",
#       "fields": [
#         { "name": "_id",
#           "type": { "name": null, "kind": "NON_NULL" } },
#         { "name": "posterUrl",
#           "type": { "name": null, "kind": "NON_NULL" } },
#         { "name": "title",
#           "type": { "name": null, "kind": "NON_NULL" } },
#         { "name": "prev",
#           "type": { "name": "PostItemModel", "kind": "OBJECT" } },
#         ...
#       ]
#     }
#   }
# }
```

```
INTROSPECTION — ỨNG DỤNG:
═══════════════════════════════════════════════════════════════

  ① IDE / Playground:
  → GraphQL Playground, GraphiQL, Apollo Studio
  → Autocomplete, field suggestions, documentation!
  → Tất cả dựa trên introspection!

  ② Code Generation:
  → graphql-codegen: tạo TypeScript types TỰ ĐỘNG từ schema!
  → Không cần viết types thủ công!

  ③ Documentation:
  → Schema = documentation sống!
  → Luôn chính xác và cập nhật!

  ⚠️ BẢO MẬT: Tắt introspection trên PRODUCTION!
  → Xem chi tiết ở §9!
```

---

## §9. Security — Bảo mật GraphQL Production

```
5 BIỆN PHÁP BẢO MẬT GRAPHQL:
═══════════════════════════════════════════════════════════════

  ① TẮT DEBUG MODE TRÊN PRODUCTION:
  ┌────────────────────────────────────────────────────────┐
  │ debug: true → hiển thị ERROR STACK TRACE!              │
  │ → Attacker thấy internal file paths, functions!        │
  │ → Thông tin nhạy cảm!                                  │
  │                                                        │
  │ → Production: debug: false!                            │
  └────────────────────────────────────────────────────────┘

  ② TẮT PLAYGROUND TRÊN PRODUCTION:
  ┌────────────────────────────────────────────────────────┐
  │ Playground = tool thử nghiệm queries!                  │
  │ → Chỉ dùng DEV / STAGING!                              │
  │ → Production → TẮT! Không expose ra ngoài!             │
  │                                                        │
  │ // NestJS:                                              │
  │ GraphQLModule.forRoot({                                │
  │     playground: process.env.NODE_ENV !== 'production',  │
  │ })                                                     │
  └────────────────────────────────────────────────────────┘

  ③ TẮT INTROSPECTION TRÊN PRODUCTION:
  ┌────────────────────────────────────────────────────────┐
  │ Introspection cho phép tra cứu TOÀN BỘ schema!         │
  │ → Attacker biết hết data types, fields, scalars!        │
  │ → KHÔNG nên expose trên production!                    │
  │                                                        │
  │ GraphQLModule.forRoot({                                │
  │     introspection: process.env.NODE_ENV !== 'production'│
  │ })                                                     │
  └────────────────────────────────────────────────────────┘

  ④ GIỚI HẠN ĐỘ SÂU QUERY (Depth Limiting):
  ┌────────────────────────────────────────────────────────┐
  │ NGUY HIỂM — Nested query attack:                       │
  │                                                        │
  │ query {                                                │
  │   author(id: 42) {                                     │
  │     posts {                                            │
  │       author {                                         │
  │         posts {                                        │
  │           author {                                     │
  │             posts { ... }   ← VÔ HẠN! 💀              │
  │           }                                            │
  │         }                                              │
  │       }                                                │
  │     }                                                  │
  │   }                                                    │
  │ }                                                      │
  │                                                        │
  │ → Query ĐỆ QUY → tốn CPU + memory → CRASH backend!   │
  │                                                        │
  │ GIẢI PHÁP: graphql-depth-limit                        │
  │ → Giới hạn số tầng query tối đa!                       │
  │                                                        │
  │ import depthLimit from 'graphql-depth-limit';          │
  │ GraphQLModule.forRoot({                                │
  │     validationRules: [depthLimit(5)],  // Max 5 tầng!  │
  │ })                                                     │
  └────────────────────────────────────────────────────────┘

  ⑤ GIỚI HẠN SỐ LƯỢNG PHÂN TRANG (Pagination Limiting):
  ┌────────────────────────────────────────────────────────┐
  │ NGUY HIỂM:                                             │
  │ query {                                                │
  │   authors(first: 1000) {                               │
  │     posts(last: 100) { ... }                           │
  │   }                                                    │
  │ }                                                      │
  │ → 1000 × 100 = 100,000 records! → CRASH! 💀           │
  │                                                        │
  │ GIẢI PHÁP 1: graphql-input-number                     │
  │ → Giới hạn giá trị tối đa của number!                  │
  │                                                        │
  │ GIẢI PHÁP 2: class-validator (Code First!)             │
  │ @InputType()                                           │
  │ export class SomeNumberInput {                         │
  │     @IsInt()                                           │
  │     @Min(1)                                            │
  │     @Max(10)       // Tối đa 10 items/page!            │
  │     public readonly pageSize: number;                  │
  │ }                                                      │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  GraphQL
  ├── Khái niệm: Query language cho APIs (không phải DB!)
  │   └── Facebook 2015 → GraphQL Foundation 2018
  ├── 2 Nguyên lý: (1) Trả data CHÍNH XÁC, (2) 1 endpoint!
  ├── vs REST: flexibility/no versioning/type system vs caching/simplicity
  ├── SDL — Schema Definition Language
  │   ├── Object Type: type { field: Scalar! }
  │   ├── Input Type: input { field: Scalar! } (cho parameters!)
  │   ├── Scalar: Int/Float/String/Boolean/ID + custom (DateScalar!)
  │   ├── Enum: tập giá trị cố định!
  │   └── Interface: abstract type, object phải implement!
  ├── Operations:
  │   ├── Query = đọc (GET)
  │   ├── Mutation = ghi (POST/PUT/DELETE)
  │   └── Subscription = real-time (WebSocket!)
  ├── Code First (NestJS):
  │   ├── @ObjectType/@InputType → generate SDL tự động!
  │   ├── class-validator → ràng buộc CHẶT hơn SDL!
  │   └── @Resolver + @Query/@Mutation/@Args → handler!
  ├── Frontend: Apollo Client
  │   ├── useQuery/useMutation hooks!
  │   ├── Fragment → tái sử dụng fields (DRY!)
  │   └── Caching, DevTools, Code Generation!
  ├── Introspection: tra cứu schema tự động!
  │   └── __type, __schema → IDE/playground/codegen!
  └── Security:
      ├── Tắt debug/playground/introspection trên PROD!
      ├── graphql-depth-limit: chống nested query attack!
      └── Pagination limiting: class-validator @Max!
```

### Checklist

- [ ] **GraphQL là gì**: Query language cho APIs; Facebook 2015, GraphQL Foundation 2018; GitHub/Twitter/Netflix/PayPal production!
- [ ] **2 nguyên lý**: (1) Client chọn CHÍNH XÁC fields cần (no over/under fetching!); (2) 1 endpoint duy nhất /graphql!
- [ ] **vs REST**: GraphQL = flexible/typed/1 endpoint/no versioning; REST = simple/cacheable/file upload dễ; mỗi cái phù hợp tình huống khác!
- [ ] **SDL**: Schema Definition Language; type (response), input (parameters); "!" = non-null; "[Type!]!" = non-null array of non-null!
- [ ] **5 Scalars**: Int, Float, String, Boolean, ID; custom scalar cần implement parseValue/serialize/parseLiteral!
- [ ] **graphql-scalars**: ~50 scalars sẵn (DateTime, EmailAddress, URL, PositiveInt, HexColorCode...)!
- [ ] **Enum**: Scalar đặc biệt; tập giá trị CỐ ĐỊNH; truyền ngoài tập → lỗi!
- [ ] **Interface**: Abstract type; object PHẢI implement tất cả fields của interface!
- [ ] **Query vs Mutation**: Query = đọc (GET); Mutation = ghi/xóa/sửa (POST/PUT/DELETE); Subscription = real-time!
- [ ] **Code First**: NestJS decorators (@ObjectType/@InputType/@Field) → generate SDL tự động; kết hợp class-validator cho ràng buộc chặt!
- [ ] **Resolver**: @Resolver class; @Query/@Mutation methods; @Args cho parameters; @UseGuards cho authentication!
- [ ] **Apollo Client**: Framework phổ biến nhất; useQuery/useMutation hooks; auto-caching; hỗ trợ React/Vue/Angular/mobile!
- [ ] **Fragment**: Tập hợp fields tái sử dụng; ...FragmentName spread; DRY principle; thay đổi 1 chỗ → áp dụng toàn bộ!
- [ ] **Introspection**: **type/**schema queries; tra cứu schema tự động; dùng cho IDE/playground/codegen; TẮT trên production!
- [ ] **Security 5 điểm**: (1) Tắt debug (stack trace!); (2) Tắt playground; (3) Tắt introspection; (4) depth-limit (chống nested attack!); (5) pagination limit (@Max!)!
- [ ] **Nested query attack**: Query đệ quy author→posts→author→... → crash backend; graphql-depth-limit giới hạn max depth!

---

_Nguồn: ConardLi — "In-depth understanding of GraphQL" · TikTok Frontend Security Team · GraphQL Official Docs_
_Cập nhật lần cuối: Tháng 2, 2026_
